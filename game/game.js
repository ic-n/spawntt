// Constants for easy configuration
const SAFE_TOP = 100
const GRID_LINES_ENEMY = 16
const GRID_LINES_TOWER = 8
const ENEMY_HEALTH = 52
const ENEMY_SPEED = .666
const ENEMY_ATTACK_DAMAGE = 5
const ENEMY_ATTACK_COOLDOWN = 60
const TOWER_HEALTH = 30
const TOWER_COOLDOWN = 30
const BULLET_DAMAGE = 13
const BULLET_SPEED = 4
const MAX_TOWERS = 6
const BACKGROUND_COLOR = '#fff'
const FOREGROUND_COLOR = '#3e3734'

const BASE_SPAWN_RATE = 150

let ENEMY_SIZE = 80
let TOWER_RANGE = 80
let ENEMY_SPAWN_RATE = BASE_SPAWN_RATE + 20

let evil = []
let cowboy = []
let hoodie = []
let mindao = []
let stone = []

let enemies = []
let towers = []
let walls = []
let bullets = []
let waveCount = 0
let gameOver = false

let clickerctions = 0

let animate = []

let currentTowerType = 0
let towerTypes = [
    { name: "Hoodie", images: hoodie, price: 5 },
    { name: "Mindao", images: mindao, price: 10 },
    { name: "Cowboy", images: cowboy, price: 20 },
    { name: "Stone", images: stone, price: 20 },
]

let bgColorAInterpolatedColor = 0

const Score = (() => {
    let scoreElement
    let deviceID
    let currentScore
    let localScore = 0

    async function init() {
        scoreElement = document.getElementById("score")
        deviceID = localStorage.getItem("shrouds__device_id") || generateDeviceID()
        currentScore = parseInt(localStorage.getItem("shrouds__score") ?? "20")
        await Score.syncScore()
        updateDisplay()
    }

    function generateDeviceID() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < 36; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        localStorage.setItem("shrouds__device_id", result)
        return result
    }

    function updateDisplay() {
        scoreElement.textContent = currentScore
    }

    async function addScore(points) {
        currentScore += points
        localScore += points
        if (clickerctions > 5) {
            localStorage.setItem("shrouds__score", localScore)
        }
        updateDisplay()
    }

    async function syncScore() {
        try {
            clickerctions = 0
            const normalizedScore = 120
            localScore = normalizedScore
            currentScore = normalizedScore !== undefined ? normalizedScore : currentScore

            for (const [dev, ns] of Object.entries(data.Normalised)) {
                if (dev == deviceID) {
                    continue
                }

                currentScore += ns
            }

            updateDisplay()

            return normalizedScore
        } catch (error) {
            console.error("Failed to fetch score from API:", error)
        }
        return {}
    }

    return {
        init,
        addScore,
        syncScore,
    }
})()

document.addEventListener("DOMContentLoaded", Score.init)

function setup() {
    evil.push(loadImage("evil/159.png")) // 0 football
    evil.push(loadImage("evil/321.png")) // 1 office
    evil.push(loadImage("evil/694.png")) // 2 office blue
    evil.push(loadImage("evil/919.png")) // 3 scarf
    evil.push(loadImage("evil/2013.png")) // 4 magic
    evil.push(loadImage("evil/3228.png")) // 5 bandit
    evil.push(loadImage("evil/3293.png")) // 6 dynamite
    evil.push(loadImage("crown/1226.png")) // 7 crown

    cowboy.push(loadImage("cowboy/1574.png"))
    cowboy.push(loadImage("cowboy/2716.png"))
    cowboy.push(loadImage("cowboy/3263.png"))

    hoodie.push(loadImage("hoodie/1080.png"))
    hoodie.push(loadImage("hoodie/2006.png"))
    hoodie.push(loadImage("hoodie/2173.png"))

    mindao.push(loadImage("mindao/882.png"))
    mindao.push(loadImage("mindao/1457.png"))
    mindao.push(loadImage("mindao/3032.png"))

    stone.push(loadImage("reap.png"))

    ENEMY_SIZE = windowHeight / GRID_LINES_ENEMY
    TOWER_RANGE = ENEMY_SIZE * 3

    window.Telegram.WebApp.expand()
    createCanvas(windowWidth, windowHeight - document.getElementById('topbar').offsetHeight)

    const towerImages = document.querySelectorAll('.icontype')

    towerImages.forEach(img => {
        img.addEventListener('click', (event) => {
            towerImages.forEach(img => img.classList.remove('active'))
            const clickedImage = event.currentTarget
            clickedImage.classList.add('active')
            currentTowerType = parseInt(clickedImage.getAttribute('data-tower-type'))
        })
    })

    restartGame()
}

function makeid(length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter += 1
    }
    return result
}

function restartGame() {
    enemies = []
    towers = []
    walls = []
    bullets = []
    waveCount = 0
    gameOver = false
    document.getElementById("gg").classList.replace("nok", "ok")

    ENEMY_SPAWN_RATE = BASE_SPAWN_RATE

    for (let y = 0; y < GRID_LINES_TOWER; y++) {
        const towerY = snapToGrid(((height / GRID_LINES_TOWER) * y), GRID_LINES_TOWER)
        walls.push(new Tower(windowWidth - ENEMY_SIZE / 2, towerY, 3))
    }
}

function draw() {
    push()

    const bgColorA = getInterpolatedColor(bgColorAInterpolatedColor)
    if (gameOver) {
        document.documentElement.style.setProperty('--bg-color-a', bgColorA)
        background(bgColorA + "05")
        return
    }
    document.documentElement.style.setProperty('--bg-color-a', bgColorA)
    background(bgColorA + "30")

    drawGrid()
    noStroke()

    updateEnemies()
    updateTowers(towers, true)
    updateTowers(walls, false)
    updateBullets()

    if (frameCount % Math.ceil(Math.max(3, ENEMY_SPAWN_RATE)) === 0) {
        enemies.push(new Enemy())
        enemies.push(new Enemy())
        enemies.push(new Enemy())
        waveCount++
    }

    for (let i = 0; i < animate.length; i++) {
        const a = animate[i]
        if (a.ttl <= 0) {
            animate.splice(i, 1)
            continue
        }
        push()
        fill(255)
        textAlign(CENTER, CENTER)
        textSize(ENEMY_SIZE * 4)
        if (a.type == "rotate") {
            a.ttl--
            translate(a.x, a.y)
            rotate(a.ttl * .2)
            text(a.img, 0, 0)
        } else {
            text(a.img, a.x, a.y)
        }
        pop()
    }


    // displayStatus()
    pop()
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i]
        enemy.update()

        if (enemy.health <= 0) {
            enemies.splice(i, 1)
            Score.addScore(1)
            ENEMY_SPAWN_RATE -= .4
            bgColorAInterpolatedColor = 1 - (ENEMY_SPAWN_RATE / BASE_SPAWN_RATE)
        }

        if (enemy.x > width) {
            gameOver = true
            document.getElementById("gg").classList.replace("ok", "nok")
            Score.syncScore()
        }

        enemy.display()
    }
}

function updateTowers(tl, shoot) {
    for (let i = tl.length - 1; i >= 0; i--) {
        let tower = tl[i]
        tower.display()
        if (shoot) {
            tower.shoot(enemies)
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j]
            if (enemy.isNearTower(tower)) {
                enemy.attack(tower)

                if (tower.health <= 0) {
                    if (tower.type == 3) {
                        animate.push({
                            img: "⛏️",
                            x: tower.x,
                            y: tower.y,
                            type: "rotate",
                            ttl: 90,
                        })
                        for (let target of enemies) {
                            const d = dist(tower.x, tower.y, target.x, target.y)
                            if (d < ENEMY_SIZE * 2) {
                                target.health = 0
                            }
                            if (d < ENEMY_SIZE * 6) {
                                target.health -= target.maxHealth / 2
                            }
                        }
                    }
                    tl.splice(i, 1)
                    break
                }
            }
        }
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i]
        bullet.move()

        if (!bullet.target || bullet.target.health <= 0) {
            bullets.splice(i, 1)
            continue
        }

        bullet.display()

        if (dist(bullet.x, bullet.y, bullet.target.x, bullet.target.y) < 10) {
            bullet.effect()
            bullets.splice(i, 1)
        }
    }
}

function handleInteraction(x, y) {
    if (y < 10) {
        return
    }

    clickerctions+=1

    if (gameOver) {
        restartGame()
        return
    }

    let towerY = snapToGrid(y, GRID_LINES_TOWER)

    if (towers.length >= MAX_TOWERS) {
        towers.shift() // Remove the oldest tower if limit is exceeded
    }

    towers.push(new Tower(x, towerY, currentTowerType))
    Score.addScore(-towerTypes[currentTowerType].price)
}

function mousePressed() {
    handleInteraction(mouseX, mouseY)
}

function touchStarted() {
    handleInteraction(touches[0].x, touches[0].y)
}

class Enemy {
    constructor() {
        this.type = floor(random(evil.length))

        this.x = -ENEMY_SIZE
        this.y = snapToGrid(random(0, height), GRID_LINES_ENEMY)
        this.health = ENEMY_HEALTH
        this.damage = ENEMY_ATTACK_DAMAGE
        this.usualCooldown = ENEMY_ATTACK_COOLDOWN

        this.speed = ENEMY_SPEED
        switch (this.type) {
            case 0: // football
                this.health *= 4
                this.speed *= 0.5
                break
            case 1: // office
                break
            case 2: // office blue
                break
            case 3: // scarf
                break
            case 4: // magic
                this.usualCooldown *= 0.3
                this.damage *= 0.6
                break
            case 5: // bandit
                this.damage *= 3
                break
            case 6: // dynamite
                this.damage *= 4
                this.speed *= 0.5
                break
            case 7: // crown
                this.speed *= 2
                break
        }

        this.maxHealth = this.health
        this.attacking = false
        this.cooldownCounter = 0
    }

    update() {
        if (!this.attacking) {
            this.x += this.speed
        } else if (this.cooldownCounter > 0) {
            this.cooldownCounter--
        } else {
            this.attacking = false
        }
    }

    isNearTower(tower) {
        let d = dist(this.x, this.y, tower.x, tower.y)
        if (this.type == 4) {
            const sss = ENEMY_SIZE * 3
            return d < sss && this.x > tower.x - sss / 2
        }
        return d < ENEMY_SIZE && this.x > tower.x - ENEMY_SIZE / 2
    }

    attack(tower) {
        this.attacking = true

        if (this.cooldownCounter <= 0) {
            if (this.type == 4) {
                bullets.push(new Bullet(this.x, this.y, tower, 666, this.damage))
            } else {
                tower.health -= this.damage
            }
            this.cooldownCounter = this.usualCooldown
        }

        if (tower.health <= 0) {
            this.attacking = false
        }
    }

    displayShroud() {
        let shake = random(3) - 1
        image(evil[this.type], this.x - ENEMY_SIZE / 2, (this.y - ENEMY_SIZE / 2) + shake, ENEMY_SIZE, ENEMY_SIZE)
    }

    display() {
        this.displayShroud()
        displayHealthBar("#f00", this.x, this.y - ENEMY_SIZE * .6, this.health, this.maxHealth)
    }
}

class Tower {
    constructor(x, y, type) {
        this.img = 0
        this.type = type

        this.img = Math.floor(Math.random() * towerTypes[type].images.length)

        this.x = x
        this.y = y
        this.health = TOWER_HEALTH
        if (this.type == 3) {
            this.health = TOWER_HEALTH / 10
        }
        this.maxHealth = this.health
        this.cooldown = 0

    }

    displayShroud() {
        let png = towerTypes[this.type].images[this.img]
        push()
        scale(-1, 1)
        image(png, -(this.x + ENEMY_SIZE / 2), this.y - ENEMY_SIZE / 2, ENEMY_SIZE, ENEMY_SIZE)
        pop()
    }

    display() {
        this.displayShroud()
        displayHealthBar("#0f0", this.x, this.y - ENEMY_SIZE * .6, this.health, this.maxHealth)

        noFill()
        // stroke(FOREGROUND_COLOR + "20")
        // ellipse(this.x, this.y, TOWER_RANGE * 2)
        // noStroke()
    }

    shoot(enemies) {
        if (this.cooldown > 0) {
            this.cooldown--
            return
        }

        let targets = []
        for (let enemy of enemies) {
            if (dist(this.x, this.y, enemy.x, enemy.y) < TOWER_RANGE) {
                targets.push(enemy)
            }
        }

        if (targets.length == 0) {
            return
        }

        const t = targets.at(Math.floor(Math.random() * targets.length))
        bullets.push(new Bullet(this.x, this.y, t, this.type, BULLET_DAMAGE))
        this.cooldown = TOWER_COOLDOWN
        if (this.type == 0) {
            this.cooldown *= 0.75
        }
        if (this.type == 2) {
            this.cooldown *= 2
        }
    }
}

class Bullet {
    constructor(x, y, target, type, damage) {
        this.x = x
        this.y = y
        this.target = target
        this.damage = damage
        this.type = type
    }

    move() {
        if (this.target) {
            let angle = atan2(this.target.y - this.y, this.target.x - this.x)
            this.x += cos(angle) * BULLET_SPEED
            this.y += sin(angle) * BULLET_SPEED
        }
    }

    effect() {
        this.target.health -= this.damage
        switch (this.type) {
            case 0: // bone
                break
            case 1: // brain
                this.target.speed *= .75
                break
            case 2: // fire
                for (let enemy of enemies) {
                    if (enemy.x >= this.target.x) {
                        continue
                    }
                    let bulletMax = Math.floor(Math.random() * 4) - 1
                    if (dist(this.x, this.y, enemy.x, enemy.y) < TOWER_RANGE) {
                        bullets.push(new Bullet(this.x, this.y, enemy, this.type, BULLET_DAMAGE))
                        bulletMax--
                        if (bulletMax == 0) {
                            break
                        }
                    }
                }
                break
            default:
                break
        }
    }

    display() {
        fill(FOREGROUND_COLOR)
        textSize(ENEMY_SIZE / 4)
        let shakex = random(3) - 1
        let shakey = random(3) - 1
        switch (this.type) {
            case 0:
                text("🦴", this.x + shakex, this.y + shakey)
                break
            case 1:
                text("🧠", this.x + shakex, this.y + shakey)
                break
            case 2:
                text("🔥", this.x + shakex, this.y + shakey)
                break
            case 666:
                text("🍄", this.x + shakex, this.y + shakey)
                break
            case 667:
                text("🧨", this.x + shakex, this.y + shakey)
                break
        }

    }
}

function snapToGrid(y, numRows) {
    let rowHeight = height / numRows
    return floor(y / rowHeight) * rowHeight + rowHeight / 2
}

function drawGrid() {
    for (let i = 1; i <= GRID_LINES_ENEMY; i++) {
        if (i % 2 == 1) {
            stroke(FOREGROUND_COLOR + "10")
        } else {
            stroke(FOREGROUND_COLOR + "05")
        }
        let y = (i * height) / GRID_LINES_ENEMY
        line(0, y, width, y)
    }
}

function displayHealthBar(color, x, y, health, maxHealth) {
    let healthBarWidth = ENEMY_SIZE / 2
    let healthBarHeight = ENEMY_SIZE / 20
    let healthRatio = health / maxHealth
    if (healthRatio >= 1) { return }


    noStroke()
    fill(150)
    rect(x - healthBarWidth / 2, y, healthBarWidth, healthBarHeight)
    fill(color)
    rect(x - healthBarWidth / 2, y, healthBarWidth * healthRatio, healthBarHeight)
}

function displayStatus() {
    fill(FOREGROUND_COLOR)
    textSize(16)
    textAlign(LEFT)
    text("Wave: " + waveCount, 10, 20)
    text("Towers: " + towers.length + "/" + MAX_TOWERS, 10, 40)
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight - document.getElementById('topbar').offsetHeight)
}

function lerp(a, b, t) {
    return a + (b - a) * t
}
function hexToRgba(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        parseInt(hex.slice(7, 9), 16) / 255,
    ]
}
function rgbaToHex(rgba) {
    return `#${rgba.slice(0, 3).map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}
function getInterpolatedColor(value) {
    value = Math.max(0, Math.min(1, value))

    // todo dont' hard
    const colors = [
        "#9cae84ff",
        "#88aeb5ff",
        "#ae9fc6ff",
        "#b0807eff",
    ].map(hexToRgba)

    let color1, color2, intervalValue
    if (value <= 0.33) {
        color1 = colors[0]
        color2 = colors[1]
        intervalValue = value / 0.33
    } else if (value <= 0.66) {
        color1 = colors[1]
        color2 = colors[2]
        intervalValue = (value - 0.33) / 0.33
    } else {
        color1 = colors[2]
        color2 = colors[3]
        intervalValue = (value - 0.66) / 0.34
    }

    const interpolatedColor = color1.map((c, i) => lerp(c, color2[i], intervalValue))

    return rgbaToHex(interpolatedColor)
}
