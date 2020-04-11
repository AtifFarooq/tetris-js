const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

// scale everything 20x
context.scale(20, 20);

function arenaSweep() {
    let rowCount = 1;
    // start from the bottom of the arena & move up
    outer: for (let y = arena.length - 1; y > 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            // if the row has a 0 in it, it is not fully populated
            if (arena[y][x] == 0) {
                continue outer;
            }
        }

        // remove that row from the arena
        // splice will return the array, we use
        // [0] to immediately access it and fill
        // with zeroes
        const row = arena.splice(y, 1)[0].fill(0);
        // add the new empty row to the top of the arena
        arena.unshift(row);
        // since we removed the row, we have to offset the y
        y++;

        player.score += rowCount * 10;
        // double the score you get after every sweep
        rowCount *= 2;
        console.log(player.score);
    }
}
 
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            // if entry in matrix equates entry in
            // arena at the offset position
            // Note that we also check if the row
            // exists in the arena or not
            if (m[y][x] !== 0 && 
                (arena[y + o.y] && 
                arena[y + o.y][x + o.x]) !== 0) {
                    // there is a collision
                    return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2]
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3]
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0]
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0]
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ];
    }      
}

// a general draw function
function draw() {
    // clear the canvas everytime draw is called
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            // only draw if value is not zero
            if (value !== 0) {
                context.fillStyle = colours[value];
                context.fillRect(x + offset.x, 
                                 y + offset.y, 
                                 1, 1);
            }
        });
    });
}

// copy all values from player into 
// arena at the correct position
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            // values that are zero are ignored
            if (value !== 0) {
                // copy the value to the arena at correct offset
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    // if collision, move player back up
    // a step, merge & set player back to the top
    collide(arena, player);
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    // we don't want another drop to happen immediately afterwards
    dropCounter = 0;
}

function playerMove(direction) {
    player.pos.x += direction;
    if (collide(arena,player)) {
        // if we move & collide, move back
        // avoids exiting the arena
        player.pos.x -= direction;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    // choose random and put player and the top-middle
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - 
                    (player.matrix[0].length / 2 | 0);
    // if we collide immediately after respawing, game's over
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        // reset the score
        player.score = 0;
        updateScore();
    }
}

function playerRotate(direction) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, direction);
    // check for wall collisions after
    // doing a rotation until clear
    while (collide(arena, player)) {
        player.pos.x += offset;
        // if there is still a collision
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            return
        }
    }
}

function rotate(matrix, direction) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            // tuple switch that represents matrix transpose
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ]
        }
    }

    // reverse the rows of the matrix
    if (direction > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 500;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

// make a 20 * 12 matrix
const arena = createMatrix(12, 20);

const colours = [
    null,
    'purple',
    'yellow',
    'orange',
    'blue',
    'aqua',
    'green',
    'red'
];

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
}

document.addEventListener("keydown", event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();

