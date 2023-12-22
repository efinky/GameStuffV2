/*

The overall architecture is as follows: There is one server and any number of
clients. When the client wants to perform an action, rather than immediately
taking the action, it sends an event to the server, the server will timestamp
the event and send it to all connected clients. The clients then only process
events that they have received them from the server.

```
sequenceDiagram
    client1->>server: Sends event
    note over server: timestamp event
    server->>client1: Returns event
    server->>client2: Sends event
    server->>client3: Sends event
```

This way as long as all clients start with the same state, they can process all
the same events, all in the same order and all of their states should stay in
sync. Simple right?



However, there are some additional complications if we want this "simultaneous
simulation" to progress in real-time (which we usually do), _especially_ if it's
something like a video game where we need the simulation to progress smoothly
without any stuttering.


One might think we could just process events as we receive them from the server,
and this would work if the events were truly the only input to the simulation,
but often there is an implicit input of time.

To make this more concrete, lets say this simulation is a video game. In this
video game we fired a missile at an opponent player. As a client we've sent an
event that we've fired a missile, and the server has relayed that event to all
clients so they all know to draw the missile on the screen, etc..

However, in order to draw progress (and especially to do it smoothly) of missile
zooming towards its target, we need to continually update the position of the
missile, and we will need to do it even if there are no new incoming player
events. Additionally, when you're animating something like this, you don't have
control how fast time progresses, you have to render frames at consistent
intervals to make the animation smooth. if you are using this for games, you'll
likely use javascript's `requestAnimationFrame()` to know when to render the
next frame, which means you get _told_ what time it really is and you'll have to
run the simulation forward to the appropriate point.


- In order for the simulation/animations/etc to progress smoothly, the
  progression of time (at least from the perspective of that particular client)
  has to be controlled _by that client_.

So because we cannot process events immediately, each client is going to have an
incoming queue of events it has received from the server.

And in my particular API, clients can pull events from the queue in chunks based
on a certain amount of time. The size of these "chunks" must be fixed and agreed
upon by all clients. (One could conceivably use variable sized chunks but you'd
need some way to coordinate the sizes with the other clients, which would be a
real pain)


However there is an additional problem. If there haven't been any new events in
a while, and the incoming event queue is empty, how do we know that there
haven't been any new events in the next "chunk" of simulation time? The answer
is: we can't!

To illustrate this problem, lets use our missile example again. Lets say we
haven't gotten any new events in a while, and the local simulation has
progressed to the point where the missile has hit its target. But how do we know
that the other player didn't raise a shield in the last "chunk" of time? We
don't! They might have, and the server might have even timestamped the event and
sent it to us, but it might still be on its way. So we can't just assume that
the missile hit we have to wait for another event to come in from the server.

To solve this problem we have the server send out a "tick" (also timestamped) on
a set interval. This way when we see a tick we can know that we're not waiting
for any new events and can run the simulation up to the timestamp on the tick.

And as long as get a new tick before we've processed all the events in up to the
last tick, we can avoid stuttering and the simulation will appear smooth.

But wait! you say, do we really need to wait for the next tick? If we happen to
get new events from the server, far enough into the future to know for sure
what's going to be in the next chunk, can't we just add that chunk to the queue
immediately? won't that let us keep the amount we have to buffer shorter? And
yes you can, and yes it will, but this will lead to stuttering, because you are not _guaranteed_ to
get another chunk on after that one.




So there are actually two time parameters for our "simultaneous simulation":

- There's how often the tick message is sent, this allows time to progress
  without user inputs. It's also effectively how long events are buffered (i.e.
  delayed) to prevent stuttering So you want this value to be short, but if you
  make it too short you'll be sending a lot of tick messages which will increase
  the load on the server and the clients.
- There also is the unit of time chunking you want to process incoming events in
  (everyone needs to agree which) Ideally this should line up with your
  "simulation" frame rate, which often is the same as your "rendering" frame
  rate, but will definitely not always be the case especially if you're using
  something like `requestAnimationFrame()` as actual frame rates will differ
  from client to client.


TimeChunkedEventQueue is designed to encapsulate much of this complexity. And
also handles some annoying edge cases gracefully, for example if your
"rendering" frame rate (say how often `requestAnimationFrame()` calls your code
(and you call `getEvents()`)) is slower than your "simulation" frame rate (which
is your unit of time chunking), it should still work fine, `getEvents()` will
just return multiple chunks of events at once, this may appear to clients like a
"skipped" frame, but is still pretty smooth.

*/

/**
 * @template E
 * @typedef {{
 *   simTime: number;
 *   dt: number;
 *   peerEvents: E[];
 * }} TimeChunk
 */

/** @template {{ msgTime: number }} E */
export class TimeChunkedEventQueue {
  /**
   * @param {{
   *   simTime: number;
   *   tickPeriodMs: number;
   *   timeChunkMs: number;
   *   now: number;
   * }} init
   */
  constructor({ simTime, tickPeriodMs, timeChunkMs, now }) {
    this.lastChunkEndTime = simTime;
    this.localTime = simTime;
    this.deltaReference = now;
    this.tickPeriodMs = tickPeriodMs;
    this.timeChunkMs = timeChunkMs;
    /**
     * @type {{
     *   simTime: number;
     *   dt: number;
     *   peerEvents: E[];
     * }[]}
     */
    this.eventChunkQueue = [];
    /** @type {E[]} */
    this.msgQueue = [];

    this.hasEnded = false;
  }

  parameters() {
    return {
      simTime: this.lastChunkEndTime,
      tickPeriodMs: this.tickPeriodMs,
      timeChunkMs: this.timeChunkMs,
    };
  }

  /** @param {number} msgTime */
  processTick(msgTime) {
    // Local simTime is always incremented timeChunkMs at a time.
    // Local simTime is always <= the msgTime from the last tick. If there is
    // some time (and events) still left to process, we will leave them in the
    // queue and process them in the next tick.
    for (
      let t = this.lastChunkEndTime + this.timeChunkMs;
      t <= msgTime;
      t += this.timeChunkMs
    ) {
      const peerEvents = shiftWhile(this.msgQueue, (msg) => msg.msgTime <= t);
      // We use the time at the _end_ of the chunk, rather than the beginning.
      this.eventChunkQueue.push({
        simTime: t,
        dt: this.timeChunkMs,
        peerEvents,
      });
      this.lastChunkEndTime = t;
    }
    
  }

  endTicks() {
    // Process remaining queued events.
    if (this.msgQueue.length > 0) {
      const lastEventTime = this.msgQueue[this.msgQueue.length - 1].msgTime;
      this.processTick(lastEventTime);
    }

    this.hasEnded = true;
  }

  /** @param {E} msg */
  pushMsg(msg) {
    this.msgQueue.push(msg);
  }

  /**
   * @param {number} [time]
   * @returns {TimeChunk<E>[] | null}
   */
  getEvents(time = performance.now()) {
    // Advance by the amount of time that went by, but bound it by the chunk
    // size to prevent a large amount of time from passing at once (i.e. the
    // browser tab was in the background)
    const dt = Math.min(time - this.deltaReference, this.timeChunkMs);
    this.deltaReference = time;

    // Only advance time if we have chunks in the queue (we should normally
    // have _some_ chunks even if they are empty, and if not, we need to slow
    // down time)
    if (this.eventChunkQueue.length > 0) {
      /** @type {TimeChunk<E>[]} */
      let chunks = [];

      if (this.localTime + this.tickPeriodMs < this.lastChunkEndTime) {
        // If we're more than a tick behind, skip ahead till we're only one tick behind.
        this.localTime = this.lastChunkEndTime - this.tickPeriodMs;
      }

      this.localTime += dt;

      while (
        this.eventChunkQueue.length > 0 &&
        this.localTime >= this.eventChunkQueue[0].simTime
      ) {
        const chunk = this.eventChunkQueue.shift();
        if (chunk) {
          chunks.push(chunk);
        }
      }
      return chunks;
    }

    // After processing events, if the hasEnded flag is set and the event queue is empty,
    // return null to indicate that there will be no more future events.
    if (
      this.hasEnded &&
      this.eventChunkQueue.length === 0 &&
      this.msgQueue.length === 0
    ) {
      return null;
    }
    return [];
  }
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(x: T) => boolean} predicate
 * @returns {T[]}
 */
function shiftWhile(arr, predicate) {
  let removedElements = [];
  while (arr.length > 0 && predicate(arr[0])) {
    // The shift can't fail as we've just checked for a non-zero array length
    removedElements.push(/** @type {T} */ (arr.shift()));
  }
  return removedElements;
}
