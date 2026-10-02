import kaboom from "kaboom";

kaboom();
setGravity(2400);

loadRoot(window.location.pathname);

loadSprite("bird", "sprites/bird.png");
loadSprite("bg", "sprites/bg.png");
loadSprite("pipe", "sprites/pipe.png");
loadSound("wooosh", "sounds/wooosh.mp3");

const highScoreKey = "dodgeBirdHighScore";
const runCountKey = "dodgeBirdRunCount";
let highScore = Number(localStorage.getItem(highScoreKey)) || 0;
let runCount = Number(localStorage.getItem(runCountKey)) || 0;
let soundEnabled = localStorage.getItem("dodgeBirdSound") !== "off";

const viewportScale = () => Math.min(width(), height());
const playFlap = () => {
    if (soundEnabled) play("wooosh");
};

function addBackground() {
    add([
        sprite("bg"),
        pos(0, 0),
        scale(width() / 240, height() / 240),
        z(-1)
    ]);
}

function addHeaderLabel(label, value, x, y, hidden = false) {
    const labelText = add([
        text(label, { size: viewportScale() * 0.025 }),
        pos(x, y),
        color(180, 222, 238),
        z(10)
    ]);
    const valueLabel = add([
        text(value, { size: viewportScale() * 0.052 }),
        pos(x, y + viewportScale() * 0.028),
        color(255, 255, 255),
        z(10)
    ]);
    labelText.hidden = hidden;
    valueLabel.hidden = hidden;
    return valueLabel;
}

function addButton(label, x, y, buttonWidth, buttonHeight, tag) {
    const button = add([
        rect(buttonWidth, buttonHeight, { radius: 6 }),
        pos(x, y),
        color(16, 55, 77),
        outline(2, rgb(117, 211, 235)),
        area(),
        anchor("topleft"),
        z(19),
        tag
    ]);
    const buttonText = add([
        text(label, { size: Math.min(buttonHeight * 0.34, viewportScale() * 0.022) }),
        pos(x + buttonWidth / 2, y + buttonHeight / 2),
        anchor("center"),
        color(230, 245, 249),
        z(20)
    ]);
    return { button, buttonText };
}

scene("home", () => {
    addBackground();

    add([
        text("DODGE BIRD", { size: viewportScale() * 0.10 }),
        pos(center().x, center().y - height() * 0.20),
        anchor("center"),
        color(247, 251, 255)
    ]);

    add([
        text("NEON FLIGHT // ENDLESS RUN", { size: viewportScale() * 0.028 }),
        pos(center().x, center().y - height() * 0.11),
        anchor("center"),
        color(117, 211, 235)
    ]);

    add([
        text("BUILT BY HARBHZ", { size: viewportScale() * 0.027 }),
        pos(center().x, center().y - height() * 0.07),
        anchor("center"),
        color(255, 222, 112)
    ]);

    add([
        text(`BEST  ${highScore.toString().padStart(2, "0")}   •   RUNS  ${runCount}`, { size: viewportScale() * 0.032 }),
        pos(center().x, center().y - height() * 0.02),
        anchor("center"),
        color(230, 245, 249)
    ]);

    add([
        text("PRESS SPACE  /  CLICK  /  TAP", { size: viewportScale() * 0.037 }),
        pos(center().x, center().y + height() * 0.12),
        anchor("center"),
        color(255, 222, 112)
    ]);

    add([
        text("TAP TO FLAP  •  P PAUSES  •  M MUTES  •  COLLECT ENERGY", { size: viewportScale() * 0.022 }),
        pos(center().x, center().y + height() * 0.20),
        anchor("center"),
        color(181, 208, 219)
    ]);

    add([
        text("SOURCE CODE", { size: viewportScale() * 0.025 }),
        pos(center().x, height() - viewportScale() * 0.07),
        anchor("center"),
        color(102, 206, 232),
        area(),
        "link"
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
    const compactViewport = width() < 700;
    const physicsGravity = compactViewport ? 1800 : 2400;
    const jumpForce = compactViewport ? 480 : 800;
    const startingPipeSpeed = compactViewport
        ? Math.max(100, Math.min(270, width() * 0.34))
        : Math.min(500, Math.max(340, width() * 0.45));
    let pipeSpeed = startingPipeSpeed;
    let pipeGapMin = height() * 0.25;
    let pipeGapMax = height() * 0.32;
    let pipeHorizontalGap = Math.max(width() * (compactViewport ? 0.42 : 0.38), 105);
    let score = 0;
    let streak = 0;
    let salvageCount = 0;
    let shieldTime = 0;
    let collisionCooldown = 0;
    let flapCooldown = 0;
    let difficultyLevel = 1;
    let paused = false;

    runCount += 1;
    localStorage.setItem(runCountKey, runCount.toString());
    setGravity(physicsGravity);
    addBackground();

    const scoreText = add([
        text("00", { size: viewportScale() * 0.09 }),
        pos(center().x, viewportScale() * 0.07),
        anchor("top"),
        z(10),
        color(255, 255, 255)
    ]);

    addHeaderLabel("BEST", highScore.toString().padStart(2, "0"), viewportScale() * 0.05, viewportScale() * 0.05);
    const controlWidth = viewportScale() * (compactViewport ? 0.22 : 0.16);
    const controlHeight = viewportScale() * 0.07;
    const controlGap = viewportScale() * 0.025;
    const pauseX = width() - controlWidth - viewportScale() * 0.04;
    const soundX = pauseX - controlWidth - controlGap;
    const soundControl = addButton(compactViewport ? "SND" : `SOUND ${soundEnabled ? "ON" : "OFF"}`, soundX, viewportScale() * 0.045, controlWidth, controlHeight, "sound-button");
    const pauseControl = addButton(compactViewport ? "||" : "PAUSE", pauseX, viewportScale() * 0.045, controlWidth, controlHeight, "pause-button");
    const soundButtonText = soundControl.buttonText;
    const pauseButton = pauseControl.button;
    const pauseButtonText = pauseControl.buttonText;
    const pauseLabel = add([
        text("PAUSED", { size: viewportScale() * 0.065 }),
        pos(center()),
        anchor("center"),
        color(255, 222, 112),
        z(20)
    ]);
    pauseLabel.hidden = true;
    const menuPanel = add([
        rect(viewportScale() * 0.62, viewportScale() * 0.40, { radius: 12 }),
        pos(center()),
        anchor("center"),
        color(7, 31, 49),
        outline(3, rgb(117, 211, 235)),
        z(18)
    ]);
    const menuTitle = add([
        text("FLIGHT MENU", { size: viewportScale() * 0.045 }),
        pos(center().x, center().y - viewportScale() * 0.12),
        anchor("center"),
        color(255, 222, 112),
        z(19)
    ]);
    const menuButtonWidth = viewportScale() * 0.32;
    const menuButtonHeight = viewportScale() * 0.075;
    const resumeControl = addButton("RESUME", center().x - menuButtonWidth / 2, center().y - viewportScale() * 0.04, menuButtonWidth, menuButtonHeight, "resume-button");
    const homeControl = addButton("HOME", center().x - menuButtonWidth / 2, center().y + viewportScale() * 0.055, menuButtonWidth, menuButtonHeight, "home-button");
    const menuObjects = [menuPanel, menuTitle, resumeControl.button, resumeControl.buttonText, homeControl.button, homeControl.buttonText];
    menuObjects.forEach((item) => item.hidden = true);
    const streakText = add([
        text("STREAK  0", { size: viewportScale() * 0.025 }),
        pos(center().x, viewportScale() * 0.18),
        anchor("top"),
        color(255, 222, 112),
        z(10)
    ]);
    const bonusText = add([
        text("", { size: viewportScale() * 0.028 }),
        pos(center().x, viewportScale() * 0.22),
        anchor("top"),
        color(117, 211, 235),
        z(10)
    ]);
    const shieldText = add([
        text("SHIELD  OFFLINE", { size: viewportScale() * 0.023 }),
        pos(center().x, viewportScale() * 0.25),
        anchor("top"),
        color(255, 222, 112),
        z(10)
    ]);
    const waveText = add([
        text("WAVE  1", { size: viewportScale() * 0.024 }),
        pos(viewportScale() * 0.05, height() - viewportScale() * 0.06),
        color(181, 208, 219),
        z(10)
    ]);
    const salvageText = add([
        text("SALVAGE  0/3", { size: viewportScale() * 0.024 }),
        pos(width() - viewportScale() * 0.20, height() - viewportScale() * 0.06),
        color(181, 208, 219),
        z(10)
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
    const shieldVisual = add([
        circle(viewportScale() * 0.045),
        pos(player.pos),
        outline(3, rgb(255, 222, 112)),
        color(255, 222, 112),
        opacity(0.18),
        z(2)
    ]);
    shieldVisual.hidden = true;

    function addPipes() {
        const gap = rand(pipeGapMin, pipeGapMax);
        const shift = rand(-height() * 0.10, height() * 0.10);
        const gapTop = height() / 2 + shift - gap / 2;
        const gapBottom = height() / 2 + shift + gap / 2;

        add([
            sprite("pipe", { flipY: true }),
            pos(width(), gapTop),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            anchor("botleft"),
            "pipe",
            "top-pipe",
            { passed: false, gapTop, gapBottom }
        ]);

        add([
            sprite("pipe"),
            pos(width(), height() / 2 + shift + gap / 2),
            area(),
            scale(Math.min(width(), height()) * 0.003),
            anchor("topleft"),
            "pipe"
        ]);

        add([
            rect(viewportScale() * 0.035, viewportScale() * 0.035, { radius: 5 }),
            pos(width(), (gapTop + gapBottom) / 2),
            color(255, 222, 112),
            outline(2, rgb(255, 255, 255)),
            area(),
            anchor("center"),
            "energy"
        ]);
    }

    function pipeLoop() {
        if (!paused) addPipes();
        wait(pipeHorizontalGap / pipeSpeed, pipeLoop);
    }

    pipeLoop();

    const updateDifficulty = () => {
        difficultyLevel = 1 + Math.floor(score / 5);
        const speedCeiling = compactViewport ? startingPipeSpeed + 130 : startingPipeSpeed + 320;
        const gapFloor = compactViewport ? 0.20 : 0.16;
        const gapTightening = compactViewport ? 0.008 : 0.012;
        const spacingFloor = compactViewport ? 0.29 : 0.24;
        pipeSpeed = Math.min(speedCeiling, startingPipeSpeed + (difficultyLevel - 1) * (compactViewport ? 25 : 45));
        pipeGapMin = Math.max(height() * gapFloor, height() * (0.25 - (difficultyLevel - 1) * gapTightening));
        pipeGapMax = Math.max(height() * (gapFloor + 0.04), height() * (0.32 - (difficultyLevel - 1) * gapTightening));
        pipeHorizontalGap = Math.max(width() * spacingFloor, width() * ((compactViewport ? 0.42 : 0.38) - (difficultyLevel - 1) * (compactViewport ? 0.006 : 0.012)));
        waveText.text = `WAVE  ${difficultyLevel}`;
    };

    updateDifficulty();
    loop(2, () => {
        if (paused) return;
        updateDifficulty();
    });

    onUpdate("pipe", (p) => {
        if (!paused) p.move(-pipeSpeed, 0);
        if (p.is("top-pipe") && !p.passed && p.pos.x + p.width < player.pos.x) {
            p.passed = true;
            score += 1;
            const edgeDistance = Math.min(
                Math.abs(player.pos.y - p.gapTop),
                Math.abs(p.gapBottom - player.pos.y)
            );
            if (edgeDistance < 34) {
                streak += 1;
                streakText.text = `STREAK  ${streak}`;
                if (streak % 3 === 0) {
                    score += 1;
                    bonusText.text = "CLOSE CALL  +1";
                    wait(1.2, () => bonusText.text = "");
                }
            } else {
                streak = 0;
                streakText.text = "STREAK  0";
            }
            scoreText.text = score.toString().padStart(2, "0");
            updateDifficulty();
        }
        if (p.pos.x < -p.width - 50) destroy(p);
    });

    onUpdate("energy", (energy) => {
        if (!paused) energy.move(-pipeSpeed, 0);
        if (energy.pos.x < -energy.width - 50) destroy(energy);
    });

    player.onCollide("pipe", () => {
        if (collisionCooldown > 0) return;
        if (shieldTime > 0) {
            shieldTime = 0;
            collisionCooldown = 0.8;
            shieldText.text = "SHIELD  USED";
            bonusText.text = "IMPACT ABSORBED";
            get("pipe").forEach((pipe) => {
                if (pipe.pos.x > player.pos.x - pipe.width * 2 && pipe.pos.x < player.pos.x + pipe.width * 2) destroy(pipe);
            });
            player.jump(jumpForce * 0.7);
            wait(1.2, () => bonusText.text = "");
            return;
        }
        play("wooosh");
        go("gameover", score);
    });

    player.onCollide("energy", (energy) => {
        destroy(energy);
        score += 2;
        streak += 1;
        salvageCount += 1;
        scoreText.text = score.toString().padStart(2, "0");
        streakText.text = `STREAK  ${streak}`;
        salvageText.text = `SALVAGE  ${salvageCount}/3`;
        bonusText.text = "ENERGY  +2";
        if (salvageCount >= 3) {
            score += 3;
            salvageCount = 0;
            shieldTime = 4;
            salvageText.text = "SALVAGE  0/3";
            shieldText.text = "SHIELD  READY";
            bonusText.text = "MISSION COMPLETE  +3";
        }
        updateDifficulty();
        wait(1.2, () => bonusText.text = "");
    });

    player.onUpdate(() => {
        flapCooldown = Math.max(0, flapCooldown - dt());
        collisionCooldown = Math.max(0, collisionCooldown - dt());
        shieldTime = Math.max(0, shieldTime - dt());
        shieldVisual.pos = player.pos;
        shieldVisual.hidden = shieldTime <= 0;
        player.angle = clamp(player.vel.y * 0.035, -18, 72);
        if (shieldTime <= 0 && shieldText.text === "SHIELD  READY") shieldText.text = "SHIELD  OFFLINE";
        if (player.pos.y > height() + 30 || player.pos.y < -30) go("gameover", score);
    });

    const flap = () => {
        if (paused || flapCooldown > 0) return;
        player.jump(jumpForce);
        flapCooldown = compactViewport ? 0.12 : 0.08;
        playFlap();
    };

    const togglePause = () => {
        paused = !paused;
        setGravity(paused ? 0 : physicsGravity);
        pauseLabel.hidden = true;
        pauseButtonText.text = compactViewport ? (paused ? ">" : "||") : (paused ? "PLAY" : "PAUSE");
        pauseButton.hidden = paused;
        pauseButtonText.hidden = paused;
        menuObjects.forEach((item) => item.hidden = !paused);
    };

    const toggleSound = () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem("dodgeBirdSound", soundEnabled ? "on" : "off");
        soundButtonText.text = compactViewport ? "SND" : `SOUND ${soundEnabled ? "ON" : "OFF"}`;
    };

    onKeyPress("space", flap);
    onKeyPress("p", togglePause);
    onKeyPress("m", toggleSound);
    onClick("sound-button", toggleSound);
    onClick("pause-button", togglePause);
    onClick("resume-button", () => {
        if (paused) togglePause();
    });
    onClick("home-button", () => go("home"));
    onMousePress(() => {
        if (!pauseButton.isHovering() && !soundControl.button.isHovering()) flap();
    });
    onTouchStart((p) => {
        if (p.y < viewportScale() * 0.14 && p.x > soundX - viewportScale() * 0.02) return;
        flap();
    });
});

scene("gameover", (score) => {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(highScoreKey, highScore.toString());
    }

    addBackground();

    add([
        text("RUN COMPLETE", { size: viewportScale() * 0.075 }),
        pos(center().x, center().y - height() * 0.17),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(`SCORE  ${score.toString().padStart(2, "0")}`, { size: viewportScale() * 0.05 }),
        pos(center().x, center().y - height() * 0.05),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(`BEST   ${highScore.toString().padStart(2, "0")}`, { size: viewportScale() * 0.04 }),
        pos(center().x, center().y + height() * 0.02),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(score >= highScore && score > 0 ? "NEW RECORD" : "ONE MORE RUN?", { size: viewportScale() * 0.033 }),
        pos(center().x, center().y + height() * 0.10),
        anchor("center"),
        color(0, 160, 255)
    ]);

    add([
        text("TAP / SPACE = RESTART    SWIPE / R = HOME", { size: viewportScale() * 0.026 }),
        pos(center().x, center().y + height() * 0.16),
        anchor("center"),
        color(200, 200, 200)
    ]);

    const restart = () => go("game");
    onKeyPress("space", restart);

    onKeyPress("r", () => go("home"));
    onMousePress(restart);

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
