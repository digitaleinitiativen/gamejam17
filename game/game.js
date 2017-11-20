var SPEED = 180;
var GRAVITY = 1200;
var JUMP = 580;
var SPAWN_RATE = 2000;
var SPAWN_REDUX = 50;
var SPAWN_RAND = 400;
var ASSET_VERSION = 1; //(new Date()).getTime();
var BASE_PATH = 'game/'

var state = {
    preload: function() {
        this.load.spritesheet("player",BASE_PATH + 'assets/tile-santa.png?' + ASSET_VERSION, 48, 48, 10);
        this.load.spritesheet("enemy.kid", BASE_PATH + "assets/tile-fan.png?" + ASSET_VERSION, 48, 48, 20);
        this.load.image("background.0", BASE_PATH + "assets/background.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.1", BASE_PATH + "assets/background-1.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.2", BASE_PATH + "assets/background-2.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.3", BASE_PATH + "assets/background-3.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("floor", BASE_PATH + "assets/floor.png?" + ASSET_VERSION, 800, 8);
        this.load.image("present", BASE_PATH + "assets/present.png?" + ASSET_VERSION, 24, 24);
        this.load.image("teaser", BASE_PATH + "assets/teaser.png?" + ASSET_VERSION, 222, 105);
    },
    create: function() {

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.background0 = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background.0');
        this.background1 = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background.1');
        this.background2 = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background.2');
        this.background3 = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background.3');

        this.floor = this.add.sprite(0, this.world.height, 'floor');
        this.game.physics.enable(this.floor);
        this.floor.body.immovable = true;

        this.enemies = this.add.group();

        this.presents = this.add.group();

        this.player = this.add.sprite(0, 0, 'player');
        this.player.animations.add('run', [0, 1, 2, 3, 4, 5, 6, 7], 12, true);
        this.player.animations.add('jump', [8], 1, false);
        this.player.animations.add('broken', [9], 1, false);

        this.player.animations.play('run');

        this.game.physics.enable(this.player);
        this.player.body.gravity.y = GRAVITY;
        this.player.body.setSize(24, 36, 12, 0);

        this.teaser = this.add.sprite(20, 20, 'teaser');

        this.scoreText = this.add.text(
            this.world.width / 2,
            this.world.height / 3,
            "",
            {
                fill: '#ffdd00',
                align: 'center'
            }
        );
        this.scoreText.backgroundColor = '#ffdd00';
        this.scoreText.anchor.setTo(0.5, 0.5);
        this.scoreText.fontSize = 20;
        this.score = 0;

        this.upFree = true;
        this.spawnRate = SPAWN_RATE;

        this.reset();
    },
    update: function() {
        this.game.physics.arcade.collide(this.player, this.floor);
        this.game.physics.arcade.collide(this.enemies, this.floor);

        if (this.gameStarted) {
            this.enemies.forEachAlive(function(enemy) {
                if(enemy.body.x + enemy.body.width < this.game.world.bounds.left) {
                    enemy.kill();
                }
            });
            this.presents.forEachAlive(function(present) {
                if(present.body.y > this.game.world.height)
                    present.kill();
            })
        }

        if(this.game.input.keyboard.isDown(Phaser.Keyboard.UP) || game.input.activePointer.leftButton.isDown) {
            if(this.upFree) {
                if(!this.gameStarted) {
                    this.start();
                } else if(this.gameOver) {
                    if(this.time.now > this.timeOver + 400)
                        this.reset();
                } else {
                    if(this.player.body.touching.down)
                        this.player.body.velocity.y -= JUMP;
                    else
                        this.spawnPresent();
                }
            }
            this.upFree = false;
        } else {
            this.upFree = true;
        }



        if (!this.gameOver) {
            this.background0.tilePosition.x -= this.time.physicsElapsed * SPEED / 8;
            this.background1.tilePosition.x -= this.time.physicsElapsed * SPEED / 4;
            this.background2.tilePosition.x -= this.time.physicsElapsed * SPEED / 2;
            this.background3.tilePosition.x -= this.time.physicsElapsed * SPEED / 1.5;
            this.game.physics.arcade.overlap(this.player, this.enemies, this.setGameOver, null, this);
            this.game.physics.arcade.overlap(this.enemies, this.presents, this.catchPresent, null, this);
            if(!this.player.body.touching.down)
                this.player.animations.play('jump');
            else
                this.player.animations.play('run');
        } else this.player.animations.play('broken');

    },
    start: function() {
        this.spawnTimer = this.game.time.create(this);
        this.spawnTimer.add(this.spawnRate, this.spawnEnemy, this);
        this.spawnTimer.start();

        this.scoreText.setText("SCORE: "+this.score);
        this.teaser.visible = false;

        this.gameStarted = true;
    },
    reset: function() {
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.scoreText.setText("TOUCH TO\nSTART GAME");
        this.floor.reset(0, this.world.height - this.floor.body.height);
        this.player.reset(this.world.width / 4, this.floor.body.y - this.player.body.height);
        this.enemies.removeAll();
    },
    spawnEnemy: function() {
        this.spawnTimer.stop();

        var enemy = this.enemies.create(
            this.game.width,
            this.floor.body.top - this.player.body.height,
            'enemy.kid'
        );
        this.game.physics.enable(enemy);
        enemy.body.velocity.x = -SPEED;
        enemy.body.gravity.y = GRAVITY;
        enemy.body.setSize(24, 36, 12, 0);

        enemy.animations.add('run', [9, 8, 7, 6, 5, 4, 3, 2], 12, true);
        enemy.animations.add('run-present', [17, 16, 15, 14, 13, 12, 11, 10], 12, true);
        enemy.animations.add('broken', [0], 1, false);

        enemy.animations.play('run');


        this.spawnTimer = this.game.time.create(this);
        this.spawnTimer.add(this.spawnRate + SPAWN_RAND * Math.random(), this.spawnEnemy, this);
        this.spawnRate -= SPAWN_REDUX;
        this.spawnTimer.start();
    },
    spawnPresent: function() {
        if(this.presents.countLiving() > 0) return;
        var present = this.presents.create(
            this.player.body.x + this.player.body.width / 2 - 12,
            this.player.body.bottom,
            'present'
        );
        this.game.physics.enable(present);
        present.body.velocity.x = -SPEED;
        present.body.gravity.y = GRAVITY;
    },
    catchPresent: function(enemy, present) {
        enemy.body.velocity.x *= 1.1;
        enemy.body.velocity.y -= 60;
        enemy.animations.play('run-present');
        present.kill();

        this.score += 50;
        this.scoreText.setText("SCORE: " + this.score);
    },
    setGameOver: function(player, enemy) {
        this.teaser.visible = true;
        this.timeOver = this.game.time.now;
        this.gameOver = true;

        this.enemies.forEachAlive(function(enemy) {
            enemy.body.velocity.x = 0;
            enemy.animations.play('broken');
        });

        this.spawnTimer.stop();
        this.scoreText.setText("FINAL SCORE: " + this.score +"\nTOUCH TO TRY AGAIN");
        this.player.animations.play('broken');
        enemy.animations.play('broken');
    }
};

var game = new Phaser.Game(
    800,
    200,
    Phaser.CANVAS,
    document.querySelector('#screen'),
    state
);
