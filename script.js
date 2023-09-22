window.addEventListener("load", function () {

    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");

    canvas.width = 1300;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenButton = document.getElementById("fullscreenButton");

    //apply event listners to game and keep track of key presses
    class InputHandler {
        constructor() {
            this.keys = [];
            this.touchY = '';
            this.touchThreshold = 30;
            window.addEventListener("keydown", (e) => {
                //only add key to array if it is not already in the array
                if ((e.key == 'ArrowDown' ||
                    e.key == 'ArrowUp' ||
                    e.key == 'ArrowLeft' ||
                    e.key == 'ArrowRight')
                    && this.keys.indexOf(e.key) === -1) {
                    this.keys.push(e.key);
                } else if (e.key === 'Enter' && gameOver) 
                    restartGame();
                
            });

            window.addEventListener("keyup", (e) => {
                //once key is released, remove it from the array
                if (
                    e.key == 'ArrowDown' ||
                    e.key == 'ArrowUp' ||
                    e.key == 'ArrowLeft' ||
                    e.key == 'ArrowRight') {

                    this.keys.splice(this.keys.indexOf(e.key), 1);
                    }
            });

            window.addEventListener("touchstart", (e) => {
            
                this.touchY = e.changedTouches[0].pageY;
            });

            window.addEventListener("touchmove", (e) => {
                const swipeDistance = e.changedTouches[0].pageY - this.touchY;
                if(swipeDistance < -this.touchThreshold && this.keys.indexOf('SwipeUp') === -1){
                    this.keys.push('SwipeUp');
                }
                else if(swipeDistance > this.touchThreshold && this.keys.indexOf('SwipeDown') === -1){
                    this.keys.push('SwipeDown');
                    if(gameOver){
                        restartGame();
                    }
                }   


            });

            window.addEventListener("touchend", (e) => {

                this.keys.splice(this.keys.indexOf('SwipeUp'), 1);
                this.keys.splice(this.keys.indexOf('SwipeDown'), 1);
            });

        
        }
    }

    class Player {
        constructor(gameWidth, gameHeight) {

            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;

            this.width = 200;
            this.height = 200;

            this.x = 0;
            this.y = this.gameHeight - this.height;

            this.image = document.getElementById("playerImage");

            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 8;

            //reduce enemy fps from 60 to 20 to slow down animation
            this.fps = 20;
            this.frameTimer = 0;
            this.interval = 1000 / this.fps;

            this.speed = 0;

            this.vy = 0;
            this.gravity = 1;
        }
        restart(){
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.maxFrame = 8;
            this.frameY = 0;


        }

        draw(context) {
        /*    //rectagle hit box
            context.strokeStyle = "white";
            context.strokeRect(this.x, this.y, this.width, this.height);
            //circle hit box
            context.beginPath();
            context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, 2 * Math.PI);
            context.stroke();
        */    
            //draw sprite
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(input, deltaTime, enemies) {
            //collision detection
            enemies.forEach(enemy => {
                //offset dx by half the width of the player and enemy to center the collision circle
                const dx = (enemy.x + enemy.width/2) - (this.x + this.width/2);
                //offset dy by half the height of the player and enemy to center the collision circle
                const dy = (enemy.y + enemy.height) -(this.y + this.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.width / 2 + enemy.width / 2) {
                    
                    gameOver = true;
                }
            })

            //sprite animation
            if (this.frameTimer > this.interval) {
                if (this.frameX >= this.maxFrame) {
                    this.frameX = 0;
                } else
                    this.frameX++;
                this.frameTimer = 0;
            }
            else {
                this.frameTimer += deltaTime;
            }

            //controls
            if (input.keys.indexOf('ArrowRight') > -1) {
                this.speed = 5;
            } else if (input.keys.indexOf('ArrowLeft') > -1) {
                this.speed = -5;
            } else if ((input.keys.indexOf('ArrowUp') > -1 || input.keys.indexOf('SwipeUp') > -1) && this.onGround()) {
                this.vy -= 32;
            }
            else {
                this.speed = 0;
            }

            //horizontal movement
            this.x += this.speed;
           

            //left side boundary
            if (this.x < 0) {
                this.x = 0;
            }
            //right side boundary
            if (this.x + this.width > this.gameWidth) {
                this.x = this.gameWidth - this.width;
            }
            //vertical movement
            this.y += this.vy;
            if (!this.onGround()) {
                this.vy += this.gravity;
                this.maxFrame = 5;
                this.frameY = 1;
            } else {
                this.vy = 0;
                this.maxFrame = 8;
                this.frameY = 0;
            }
            //bottom boundary
            if (this.y + this.height > this.gameHeight) {
                this.y = this.gameHeight - this.height;
            }

        }
        //create method to check if player is on the ground
        onGround() {
            return this.y >= this.gameHeight - this.height;
        }
    }

    class Background {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById("backgroundImage");
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 10;
        }
        draw(context) {
            
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            //draw second image to the right of the first image
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);

        }
        update() {
            this.x -= this.speed;
            //if background goes off screen, reset it to the beginning
            if (this.x < 0 - this.width) {
                this.x = 0;
            }
        }

        restart(){
            this.x = 0;
        }
    }
    class Enemy {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById("enemyImage");
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 5;
            //reduce enemy fps from 60 to 20 to slow down animation
            this.fps = 20;
            this.frameTimer = 0;
            this.interval = 1000 / this.fps;
            this.speed = 8;
            this.markedForDeletion = false;

        }
        draw(context) {
        /*    //rectagle hit box
            context.strokeStyle = "white";
            context.strokeRect(this.x, this.y, this.width, this.height);
            //circle hit box
            context.beginPath();
            context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, 2 * Math.PI);
            context.stroke();
        */
           context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime) {
            if (this.frameTimer > this.interval) {
                if (this.frameX >= this.maxFrame) {
                    this.frameX = 0;
                } else
                    this.frameX++;
                this.frameTimer = 0;
            }
            else {
                this.frameTimer += deltaTime;
            }

            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                //enemy evaded so increase score
                score++;
            }
        }
    }


    function handleEnemies(deltaTime) {
        if (enemyTimer > enemyInterval + randomInterval) {
            enemies.push(new Enemy(canvas.width, canvas.height));
            randomInterval = Math.random() * 1000 + 500;
            enemyTimer = 0;
        }
        else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        })
        //create new array with enemies that are not marked for deletion
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText() {
        //score display
        ctx.textAlign = "left";
        ctx.fillStyle = "black";
        ctx.font = "40px Arial";
        ctx.fillText("Score: " + score, 20, 50);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Score: " + score, 22, 50);

        //game over display
        if (gameOver) {
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
       
            ctx.fillText("GAME OVER, press ENTER or swipe down to play again!", canvas.width / 2 ,200);
            ctx.fillStyle = "white";
          
            ctx.fillText("GAME OVER, press ENTER or swipe down to play again!", canvas.width / 2, 200 + 2);
        }
    }

    function restartGame(){
        player.restart();
        background.restart();
        enemies = [];
        score = 0;
        gameOver = false;
        animate(0);

    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    fullScreenButton.addEventListener("click", function () {
        toggleFullScreen();
    });



    

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height)

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 2000;
    let randomInterval = Math.random() * 1000 + 500;

    function animate(timeStamp) {
        //adjust for screen refresh rate
        const deltaTime = (timeStamp - lastTime);
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        handleEnemies(deltaTime);
        displayStatusText(ctx);
       if (!gameOver){
        requestAnimationFrame(animate);
       }
    }
    animate(0);
});