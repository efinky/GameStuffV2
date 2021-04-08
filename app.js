import map from "./map.js";
import {Vector2d} from "./vector2d.js"
import {Rect} from "./rect.js"


export const run = () => {
    document.body.onload = () => {
        updateCanvasSize(document, document.getElementById('canvas'));
        document.addEventListener("keydown", (event) => {
            keystate[event.keyCode] = true;
        });
        document.addEventListener("keyup", (event) => {
            keystate[event.keyCode] = false;
        });
        window.addEventListener('resize', () => {
            updateCanvasSize(document, document.getElementById('canvas'));
        }, false);
        window.requestAnimationFrame(draw);
    }

    
    let keystate = [];
    let pos = new Vector2d(128, 128);
    let timestamp = performance.now();
    let imageArray = ['wall', 'grass', 'path', 'water'];

    //haha I am in your codes!
    function draw(now) {
        
        let dt = (now - timestamp)/1000;
        timestamp = now;
        let speed = 3*64*dt;
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        
        let mapSize = new Vector2d(map[0].length*64, map.length*64);
        let canvasSize = new Vector2d(canvas.width, canvas.height);
        let mapRect = new Rect(new Vector2d(0,0), mapSize.sub(canvasSize));
        
        let viewport = pos.sub(canvasSize.scale(0.5)).clamp(mapRect);

        //convert rect and vector2djs to classes.
        
        //make map tile class that contains tiles, speed and such (or terrain type)
        let maptileSize = new Vector2d(map[0].length, map.length);
        Vector2d.fromScalar(0).eachGridPoint(maptileSize, (p) => {
            ctx.drawImage(document.getElementById(imageArray[p.mapLookup(map)]), ...p.scale(64).sub(viewport).arr());
        });
    
        // Draw Person
        ctx.drawImage(document.getElementById('person'), ...pos.sub(viewport).arr());
        //left arrow
        let mySpeed = currentSpeed(pos, speed);
        let myVelocity = new Vector2d(0,0);
        if (keystate[37]) {
            myVelocity = myVelocity.add(new Vector2d(-1, 0))
        }
        //right arrow
        if (keystate[39]) {
            myVelocity = myVelocity.add(new Vector2d(1, 0))
        }
        //up arrow
        if(keystate[38]) {
            myVelocity = myVelocity.add(new Vector2d(0, -1))
        }
        //down arrow
        if (keystate[40]) {
            myVelocity = myVelocity.add(new Vector2d(0, 1))
        }
        let newPos = pos.add(myVelocity.scale(mySpeed));
        if (isWalkable(newPos) && isWalkable(newPos.add(Vector2d.fromScalar(32))))
        {
            pos = newPos;
        }
        window.requestAnimationFrame(draw);
    }

    function isWalkable(pos) {
        let tile = imageArray[pos.scale(1/64).mapLookup(map)];
        return (tile == "grass" || tile == "path" || tile == "water")                    
    }
    function currentSpeed(pos, speed) {
        let tile = imageArray[pos.scale(1/64).add(Vector2d.fromScalar(0.25)).mapLookup(map)];
        if (tile == "grass") {
            speed -= speed*.4;
        }
        else if (tile == "water") {
            speed -= speed*.9;
        }
        return speed;
    }
    function updateCanvasSize(doc, canvas) {
        canvas.width = doc.body.clientWidth;
        canvas.height = doc.body.clientHeight;
    }
}