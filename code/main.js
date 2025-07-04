import kaboom from "kaboom";

kaboom();
setGravity(2400);

loadRoot(window.location.pathname);

loadSprite("bird", "sprites/bird.png");
loadSprite("bg", "sprites/bg.png");
loadSprite("pipe", "sprites/pipe.png");
loadSound("wooosh", "sounds/wooosh.mp3");

let highScore = Number(localStorage.getItem("dodgeBirdHighScore")) || 0;

scene("home", () => {
    add([
        sprite("bg"),
        pos(0, 0),
        scale(width() / 240, height() / 240),
        z(-1)
    ]);

    add([
        text("Dodge Bird", { size: Math.min(width(), height()) * 0.10 }),
        pos(center()),
        anchor("center"),
        color(240, 240, 240)
    ]);

    add([
        text("Built by Harshil Bhatia", { size: Math.min(width(), height()) * 0.04 }),
        pos(center().x, center().y + height() * 0.08),
        anchor("center"),
        color(200, 200, 200)
    ]);

    add([
        text("Source Code", { size: Math.min(width(), height()) * 0.04 }),
        pos(center().x, center().y + height() * 0.16),
        anchor("center"),
        color(0, 150, 255),
        area(),
        "link"
    ]);

    add([
        text("Press SPACE / Click / Tap to Start", { size: Math.min(width(), height()) * 0.035 }),
        pos(center().x, center().y + height() * 0.25),
        anchor("center"),
        color(180, 180, 180)
    ]);

    const start = () => go("game");

    onKeyPress("space", start);
    onTouchStart(start);

    onMousePress(() => {
        if (!get("link")[0].isHovering()) start();
    });

    onClick("link", () => {
        window.open("https://github.com/harbhz/dodge-bird", "_blank");
    });
});

scene("game", () => {
    let pipeSpeed = 500;
    let pipeGapMin = height() * 0.25;
    let pipeGapMax = height() * 0.32;
    let pipeHorizontalGap = width() * 0.38;
    const jumpForce = 800;
    let score = 0;

    add([
        sprite("bg"),
        pos(0, 0),
        scale(width() / 240, height() / 240),
        z(-1)
    ]);

    const scoreText = add([
        text("0", { size: Math.min(width(), height()) * 0.08 }),
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
        anchor("center"),
        z(1)
    ]);

    function addPipes() {
        const gap = rand(pipeGapMin, pipeGapMax);
        const shift = rand(-height() * 0.10, height() * 0.10);

        add([
            sprite("pipe", { flipY: true }),
            pos(width(), height() / 2 + shift - gap / 2),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            move(LEFT, pipeSpeed),
            anchor("botleft"),
            "pipe",
            "top-pipe",
            { passed: false }
        ]);

        add([
            sprite("pipe"),
            pos(width(), height() / 2 + shift + gap / 2),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            move(LEFT, pipeSpeed),
            anchor("topleft"),
            "pipe"
        ]);
    }

    function pipeLoop() {
        addPipes();
        wait(pipeHorizontalGap / pipeSpeed, pipeLoop);
    }

    pipeLoop();

    loop(20, () => {
        pipeSpeed += 40;
        pipeGapMin = Math.max(height() * 0.18, pipeGapMin * 0.95);
        pipeGapMax = Math.max(height() * 0.22, pipeGapMax * 0.95);
        pipeHorizontalGap = Math.max(width() * 0.28, pipeHorizontalGap * 0.95);
    });

    onUpdate("pipe", (p) => {
        if (p.is("top-pipe") && !p.passed && p.pos.x + p.width < player.pos.x) {
            p.passed = true;
            score += 1;
            scoreText.text = score.toString();
        }
        if (p.pos.x < -p.width - 50) destroy(p);
    });

    player.onCollide("pipe", () => {
        play("wooosh");
        go("gameover", score);
    });

    player.onUpdate(() => {
        if (player.pos.y > height() + 30 || player.pos.y < -30) go("gameover", score);
    });

    const flap = () => {
        player.jump(jumpForce);
        play("wooosh");
    };

    onKeyPress("space", flap);
    onMousePress(flap);
    onTouchStart(flap);
});

scene("gameover", (score) => {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("dodgeBirdHighScore", highScore.toString());
    }

    add([
        sprite("bg"),
        pos(0, 0),
        scale(width() / 240, height() / 240),
        z(-1)
    ]);

    add([
        text("GAME OVER", { size: Math.min(width(), height()) * 0.08 }),
        pos(center().x, center().y - height() * 0.17),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(`Score : ${score}`, { size: Math.min(width(), height()) * 0.05 }),
        pos(center().x, center().y - height() * 0.05),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(`Best  : ${highScore}`, { size: Math.min(width(), height()) * 0.04 }),
        pos(center().x, center().y + height() * 0.02),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text("Tap = Restart    Swipe = Home", { size: Math.min(width(), height()) * 0.033 }),
        pos(center().x, center().y + height() * 0.10),
        anchor("center"),
        color(0, 160, 255)
    ]);

    add([
        text("SPACE = Restart    R = Home", { size: Math.min(width(), height()) * 0.033 }),
        pos(center().x, center().y + height() * 0.16),
        anchor("center"),
        color(200, 200, 200)
    ]);

    const restart = () => go("game");
    onKeyPress("space", restart);

    onKeyPress("r", () => go("home"));
    onMousePress(() => go("home"));

    let touchStartPos = null;
    const threshold = 50;

    onTouchStart((p) => {
        touchStartPos = vec2(p.x, p.y);
    });

    onTouchEnd((p) => {
        if (!touchStartPos) return;
        const dx = p.x - touchStartPos.x;
        const dy = p.y - touchStartPos.y;
        const dist = Math.hypot(dx, dy);
        touchStartPos = null;
        if (dist < threshold) restart(); else go("home");
    });
});

go("home");
