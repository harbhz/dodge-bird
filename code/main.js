import kaboom from "kaboom";

kaboom();
setGravity(2400);

loadSprite("bird", "sprites/bird.png");
loadSprite("bg", "sprites/bg.png");
loadSprite("pipe", "sprites/pipe.png");
loadSound("wooosh", "sounds/wooosh.mp3");

let highScore = 0;

scene("game", () => {
    const PIPE_SPEED = 500;
    const PIPE_GAP_MIN = height() * 0.25;
    const PIPE_GAP_MAX = height() * 0.32;
    const PIPE_HORIZONTAL_GAP = width() * 0.38;

    const JUMP_FORCE = 800;
    let score = 0;

    add([
        sprite("bg"),
        pos(0, 0),
        scale(width() / 240, height() / 240),
        z(-1)
    ]);

    const scoreText = add([
        text(score.toString(), { 
            size: Math.min(width(), height()) * 0.08
        }),
        pos(20, 20),
        z(10),
        color(255, 255, 255)
    ]);

    const player = add([
        sprite("bird"),
        pos(width() * 0.1, height() / 2),
        area(),
        body(),
        scale(Math.min(width(), height()) * 0.003),
        z(1),
        "player"
    ]);

    function producePipes() {
        const pipeGap = rand(PIPE_GAP_MIN, PIPE_GAP_MAX);
        const offset = rand(-height() * 0.1, height() * 0.1);

        add([
            sprite("pipe", { flipY: true }),
            pos(width(), height() / 2 + offset - pipeGap / 2),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            move(LEFT, PIPE_SPEED),
            anchor("botleft"),
            "pipe",
            "top-pipe",
            { passed: false }
        ]);

        add([
            sprite("pipe"),
            pos(width(), height() / 2 + offset + pipeGap / 2),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            move(LEFT, PIPE_SPEED),
            anchor("topleft"),
            "pipe",
            "bottom-pipe"
        ]);
    }

    function spawnPipeLoop() {
        producePipes();
        const interval = PIPE_HORIZONTAL_GAP / PIPE_SPEED;
        wait(interval, spawnPipeLoop);
    }

    spawnPipeLoop();

    onUpdate("pipe", (pipe) => {
        if (pipe.is("top-pipe") && !pipe.passed && pipe.pos.x + pipe.width < player.pos.x) {
            pipe.passed = true;
            score += 1;
            scoreText.text = score.toString();
        }

        if (pipe.pos.x < -pipe.width - 50) {
            destroy(pipe);
        }
    });

    player.onCollide("pipe", () => {
        try {
            play("wooosh");
        } catch (e) {
            console.log("Collision sound not available");
        }
        go("gameover", score);
    });

    player.onUpdate(() => {
        if (player.pos.y > height() + 30 || player.pos.y < -30) {
            go("gameover", score);
        }
    });

    onKeyPress("space", () => {
        player.jump(JUMP_FORCE);
        try {
            play("wooosh");
        } catch (e) {
            console.log("Sound not available");
        }
    });

    onMousePress(() => {
        player.jump(JUMP_FORCE);
        try {
            play("wooosh");
        } catch (e) {
            console.log("Sound not available");
        }
    });

    onTouchStart(() => {
        player.jump(JUMP_FORCE);
        try {
            play("wooosh");
        } catch (e) {
            console.log("Sound not available");
        }
    });
});

scene("gameover", (score) => {
    if (score > highScore) {
        highScore = score;
    }

    add([
        rect(width(), height()),
        color(0, 0, 0),
        opacity(0.7),
        z(0)
    ]);

    add([
        text("GAME OVER!", { 
            size: Math.min(width(), height()) * 0.08
        }),
        pos(center().x, center().y - height() * 0.15),
        anchor("center"),
        color(255, 255, 255),
        z(1)
    ]);

    add([
        text(`Score: ${score}`, { 
            size: Math.min(width(), height()) * 0.05
        }),
        pos(center().x, center().y - height() * 0.05),
        anchor("center"),
        color(255, 255, 255),
        z(1)
    ]);

    add([
        text(`High Score: ${highScore}`, { 
            size: Math.min(width(), height()) * 0.04
        }),
        pos(center().x, center().y),
        anchor("center"),
        color(255, 255, 255),
        z(1)
    ]);

    add([
        text("Press SPACE or Click to Restart", { 
            size: Math.min(width(), height()) * 0.03
        }),
        pos(center().x, center().y + height() * 0.08),
        anchor("center"),
        color(200, 200, 200),
        z(1)
    ]);

    onKeyPress("space", () => {
        go("game");
    });

    onMousePress(() => {
        go("game");
    });

    onTouchStart(() => {
        go("game");
    });
});

go("game");
