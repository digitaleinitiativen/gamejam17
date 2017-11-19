var SPEED = 180;
var GRAVITY = 1200;
var JUMP = 650;
var SPAWN_RATE = 1000;
var ASSET_VERSION = (new Date()).getTime();

var state = {
    preload: function() {
        this.load.spritesheet("player",'assets/player-frank-the-tank.png?' + ASSET_VERSION, 50, 50);
        this.load.spritesheet("enemy.kid", "assets/enemy-kid.png?" + ASSET_VERSION, 50, 50);
        this.load.image("background.0", "assets/background.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.1", "assets/background-1.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.2", "assets/background-2.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("background.3", "assets/background-3.png?" + ASSET_VERSION, 1600, 200);
        this.load.image("floor", "assets/floor.png?" + ASSET_VERSION, 800, 8);
        this.load.image("present", "assets/present.png?" + ASSET_VERSION, 24, 24);
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

        this.player = this.add.sprite(0, 0, 'player');
        this.game.physics.enable(this.player);
        this.player.animations.add('fly', [0, 1, 2], 10, true);
        this.player.body.gravity.y = GRAVITY;

        this.enemies = this.add.group();

        this.presents = this.add.group();

        this.scoreText = this.add.text(
            this.world.width / 2,
            this.world.height / 5,
            "",
            {
                size: '32px',
                fill: '#fff',
                align: 'center'
            }
        );
        this.scoreText.anchor.setTo(0.5, 0.5);
        this.score = 0;

        //this.input.onDown.add(this.jump, this);



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
            if(this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT) && !this.player.body.touching.down) {
                this.spawnPresent();
            }
        }

        if(this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.jump();
        }

        if (!this.gameOver) {
            this.background0.tilePosition.x -= this.time.physicsElapsed * SPEED / 8;
            this.background1.tilePosition.x -= this.time.physicsElapsed * SPEED / 4;
            this.background2.tilePosition.x -= this.time.physicsElapsed * SPEED / 2;
            this.background3.tilePosition.x -= this.time.physicsElapsed * SPEED / 1.5;
            this.game.physics.arcade.overlap(this.player, this.enemies, this.setGameOver, null, this);
            this.game.physics.arcade.overlap(this.enemies, this.presents, this.catchPresent, null, this);
        }
    },
    start: function() {
        this.player.body.allowGravity = true;
        this.player.body.collideWorldBounds = true;

        this.spawnTimer = this.game.time.create(this);
        this.spawnTimer.add(SPAWN_RATE * 2, this.spawnEnemy, this);
        this.spawnTimer.start();

        this.scoreText.setText("SCORE\n"+this.score);

        this.gameStarted = true;
    },
    reset: function() {
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.scoreText.setText("TOUCH TO\nSTART GAME");
        this.player.body.allowGravity = false;
        this.floor.reset(0, this.world.height - this.floor.body.height);
        this.player.reset(this.world.width / 4, this.floor.body.y - this.player.body.height);
        this.enemies.removeAll();
    },
    jump: function() {
        if(!this.gameStarted) {
            this.start();
        } else if(this.gameOver) {
            if(this.time.now > this.timeOver + 400)
                this.reset();
        } else {
            if(this.player.body.touching.down)
                this.player.body.velocity.y -= JUMP;
        }
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

        this.spawnTimer = this.game.time.create(this);
        this.spawnTimer.add(SPAWN_RATE * 2, this.spawnEnemy, this);
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
        present.kill();

        this.score += 50;
        this.scoreText.setText("SCORE\n" + this.score);
    },
    setGameOver: function() {
        this.timeOver = this.game.time.now;
        this.gameOver = true;

        this.enemies.forEachAlive(function(enemy) {
            enemy.body.velocity.x = 0;
        });

        this.spawnTimer.stop();
        this.scoreText.setText("FINAL SCORE\n" + this.score +"\n\nTOUCH TO\nTRY AGAIN");
    }
};

var game = new Phaser.Game(
    800,
    200,
    Phaser.CANVAS,
    document.querySelector('#screen'),
    state
);
