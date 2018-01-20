// The game width
const width = window.innerWidth;
// The game height
const height = window.innerHeight;
// The tiles
const tilesNumber = 50;
// Score panel size percentage
const scorePanelPercentage = 1 / 100 * 10;
// The score panel height
let scorePanelHeight = height * scorePanelPercentage;
// The tiles panel width
let gameWidth = width;
// The tiles panel height
let gameHeight = height - scorePanelHeight;
// The tile state map (0: default 2: flag 4: clear)
let map;
// The map dimensions
let mapDimensions;
// The bomb map (0: none 1: bomb  3: first tile)
let bombs;
// The bombs percentage (tiles: 50 percentage: 20 bombs: 10)
const bombsPercentage = 20;
// The number of bombs
let bombsNumber;
// Has already generated bombs
let hasGeneratedBombs = false;
let timer;
const flagTimeout = 300;

const clearBackgroundColor = "#40c4ff";
const bombBackgroundColor = "#f44336";

// All the magic starts from here.
$(document).ready(function () {
    mapDimensions = getHighDivisors(tilesNumber);
    // Switch form factor if  the screen is vertical or horizontal
    if (gameHeight < gameWidth)
        mapDimensions = [mapDimensions[1], mapDimensions[0]];
    // Generate tiles
    generateTiles();
    // Reload the game on smiley click
    $("#smiley").bind("touchend click", function () {
        window.location.reload();
    });
    // Increase timer after 1 second
    timer = setInterval(function () {
        if (!window.blurred) increaseTimer();
    }, 1000);
});

// Stop the timer when lost the focus
window.onblur = function () {
    window.blurred = true;
}
window.onfocus = function () {
    window.blurred = false;
}

// Adapt interface when resizing window
window.onresize = function () {
    scorePanelHeight = window.innerHeight * scorePanelPercentage;
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight - scorePanelHeight;
    let tile;
    for (let i = 0; i < mapDimensions[0]; i++) {
        const top = (i * gameHeight / mapDimensions[0]) + scorePanelHeight;
        for (let j = 0; j < mapDimensions[1]; j++) {
            tile = $("#tx" + j + "y" + i);
            tile.css('width', gameWidth / mapDimensions[1]);
            tile.css('height', gameHeight / mapDimensions[0]);
            tile.css('top', top);
            tile.css('left', j * gameWidth / mapDimensions[1]);
            // Adapt text inside the tile
            if (tile.has("span").length) {
                const tileSpan = tile.find("span");
                if (tile.height() <= tile.width()) {
                    tileSpan.css("font-size", parseInt(tile.height() / 4 * 3) + "px");
                } else
                    tileSpan.css("font-size", parseInt(tile.width() / 4 * 3) + "px");
            }
        }
    }
    updateTileImage(tile);
}

/**
 * Return a random number between two numbers [min, max]
 * @param min The minimum
 * @param max The maximum
 * @return A random number
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Return the high divisors of a number
 * @param n The number
 * @return The high divisors of a number
 */
function getHighDivisors(n) {
    const divisors = [0, 1];
    let i = 2;
    while (divisors[1] > divisors[0]) {
        if (n % i == 0) {
            divisors[0] = i;
            divisors[1] = n / i;
        }
        i++;
    }
    return divisors;
}

/**
 * Generate n tiles
 * @param n The tiles number
 */
function generateTiles() {
    map = [mapDimensions[0]];
    let tile;
    for (let i = 0; i < mapDimensions[0]; i++) {
        map[i] = [mapDimensions[1]];
        const top = (i * gameHeight / mapDimensions[0]) + scorePanelHeight;
        for (let j = 0; j < mapDimensions[1]; j++) {
            map[i][j] = 0;
            $("#tiles-panel").append("<div id=\"tx" + j + "y" + i + "\" class=\"tile\"></div>");
            tile = $("#tx" + j + "y" + i);
            tile.css('width', gameWidth / mapDimensions[1]);
            tile.css('height', gameHeight / mapDimensions[0]);
            tile.css('top', top);
            console.log(j * gameWidth / mapDimensions[1]);
            tile.css('left', j * gameWidth / mapDimensions[1]);
            detectTouch(tile);
        }
    }
    updateTileImage(tile);
}

/**
 * Update the image size that is inside a tile
 * @param {Object} tile A tile
 */
function updateTileImage(tile) {
    if (tile.height <= tile.width) {
        $(".tile img").css("width", "auto");
        $(".tile img").css("height", "75%");
    } else {
        $(".tile img").css("width", "75%");
        $(".tile img").css("height", "auto");
    }
}

/**
 * Generate the bombs map
 */
function generateBombs(tilesNumber, bombsPercentage) {
    bombs = [map.length];
    bombsNumber = Math.floor(tilesNumber / 100 * bombsPercentage);
    for (let i = 0; i < map.length; i++) {
        bombs[i] = map[i].slice(0);
    }
    let minesPlaced = 0;
    let x, y;
    while (minesPlaced < bombsNumber) {
        do {
            x = random(0, mapDimensions[1] - 1);
            y = random(0, mapDimensions[0] - 1);
        } while (bombs[y][x] == 1 || bombs[y][x] == 3);
        bombs[y][x] = 1;
        minesPlaced++;
    }
    setMinesLabel(bombsNumber);
}

/**
 * Detect the touch on a tile
 * @param {Object} tile A tile
 */
function detectTouch(tile) {

    let timeout;
    let longPress = false;

    const id = tile.attr('id');
    const x = parseInt(id.substring(id.lastIndexOf('x') + 1, id.lastIndexOf('y')));
    const y = parseInt(id.split('y').pop());
    let explosed;

    // Detect long touch
    tile.mousedown(onTouchDown);
    tile.bind("touchstart", onTouchDown);

    // Action when finger released
    tile.mouseup(onTouchUp);
    tile.bind("touchend", onTouchUp);

    /**
     * Action when click is pressed
     */
    function onTouchDown() {
        timeout = setTimeout(function () {
            longPress = true;
            if (hasGeneratedBombs && map[y][x] != 4)
                $("#flagIndicator").css('opacity', 1);
        }, flagTimeout);
        if (map[y][x] != 4) {
            $("#smiley").attr('src', 'img/click/' + random(1, 6) + '.png');
            explosed = 0;
        }
    }

    /**
     * Action when click is released
     */
    function onTouchUp() {
        if (map[y][x] != 4) {
            if (longPress && (bombsNumber > 0) && hasGeneratedBombs) {
                flagTile(tile, x, y);
            } else {
                if (!hasGeneratedBombs) {
                    map[y][x] = 3;
                    generateBombs(tilesNumber, bombsPercentage);
                    hasGeneratedBombs = true;
                }
                explosed = clearTile(x, y);
                map[y][x] = 4;
            }
            if (explosed == 0)
                $("#smiley").attr('src', 'img/happy/' + random(1, 8) + '.png');
        }
        $("#flagIndicator").css('opacity', 0);
        clearTimeout(timeout);
        longPress = false;
        hasWon();
    }
}


/**
 * Clear a tile
 * @param {Object} tile A tile
 * @param {int} x The x coordinate
 * @param {int} y The y coordinate
 */
function clearTile(x, y) {
    if (map[y][x] == 2) {
        setMinesLabel(++bombsNumber);
    }
    if (bombs[y][x] == 1) {
        $("#smiley").attr('src', 'img/sad/' + random(1, 3) + '.png');
        loose();
        return 1;
    }
    const queue = [
        [x, y]
    ];
    let adjacentTiles = [];
    let bombsAround = 0;
    let currentTile;
    let index = 0;
    while (index < queue.length) {
        currentTile = queue[index];
        const currentTileX = currentTile[0];
        const currentTileY = currentTile[1];
        const tile = $("#tx" + currentTileX + "y" + currentTileY);
        tile.css('background', clearBackgroundColor);
        $("#" + tile.attr("id") + " img").remove();
        adjacentTiles = getAdjacentTiles(currentTileX, currentTileY);
        bombsAround = countBombsAround(adjacentTiles);
        adjacentTiles = removeBombsFromTable(adjacentTiles);
        if (bombsAround == 0) {
            clearAdjacentTiles(adjacentTiles);
            adjacentTiles.forEach(function (element) {
                const x = element[0];
                const y = element[1];
                let condition = false;
                for (let i = 0; i < queue.length; i++) {
                    if (queue[i][0] == x && queue[i][1] == y)
                        condition = true;
                }
                if (!condition)
                    queue.push(element);
            });
        } else {
            // Detect if the tile has already a span inside.
            if (!tile.has("span").length) {
                if (tile.height() <= tile.width())
                    tile.append("<span style=\"font-size: " + parseInt(tile.height() / 4 * 3) + "px\">" + bombsAround + "</span>");
                else
                    tile.append("<span style=\"font-size: " + parseInt(tile.width() / 4 * 3) + "px\">" + bombsAround + "</span>");
            }
        }
        index += 1;
    }
    return 0;
}

/**
 * Return the adjacent tiles of a current tile
 * @param {int} x The x position of the current tile
 * @param {int} y The y position of the current tile
 * @return The adjacent tiles of the current tile
 */
function getAdjacentTiles(x, y) {
    let adjacentTiles = [];
    const xMax = mapDimensions[1] - 1;
    const yMax = mapDimensions[0] - 1;
    if (x == 0 && y == 0)
        adjacentTiles = [
            [x, y + 1],
            [x + 1, y + 1],
            [x + 1, y]
        ];
    else if ((x > 0 && x < xMax) && y == 0)
        adjacentTiles = [
            [x - 1, y],
            [x - 1, y + 1],
            [x, y + 1],
            [x + 1, y + 1],
            [x + 1, y]
        ];
    else if (x == xMax && y == 0)
        adjacentTiles = [
            [x - 1, y],
            [x - 1, y + 1],
            [x, y + 1]
        ];
    else if (x == xMax && (y > 0 && y < yMax))
        adjacentTiles = [
            [x, y - 1],
            [x - 1, y - 1],
            [x - 1, y],
            [x - 1, y + 1],
            [x, y + 1]
        ];
    else if (x == xMax && y == yMax)
        adjacentTiles = [
            [x, y - 1],
            [x - 1, y - 1],
            [x - 1, y]
        ];
    else if ((x > 0 && x < xMax) && y == yMax)
        adjacentTiles = [
            [x - 1, y],
            [x - 1, y - 1],
            [x, y - 1],
            [x + 1, y - 1],
            [x + 1, y]
        ];
    else if (x == 0 && y == yMax)
        adjacentTiles = [
            [x + 1, y],
            [x + 1, y - 1],
            [x, y - 1]
        ];
    else if (x == 0 && (y > 0 && y < yMax))
        adjacentTiles = [
            [x, y - 1],
            [x + 1, y - 1],
            [x + 1, y],
            [x + 1, y + 1],
            [x, y + 1]
        ];
    else
        adjacentTiles = [
            [x - 1, y - 1],
            [x, y - 1],
            [x + 1, y - 1],
            [x + 1, y],
            [x + 1, y + 1],
            [x, y + 1],
            [x - 1, y + 1],
            [x - 1, y]
        ];
    return adjacentTiles;
}

/**
 * Clear the tiles in this table
 * @param adjacentTiles A table with tiles in it
 */
function clearAdjacentTiles(adjacentTiles) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < adjacentTiles.length; i++) {
        x = adjacentTiles[i][0];
        y = adjacentTiles[i][1];
        const tile = $("#tx" + x + "y" + y);
        tile.css('background', clearBackgroundColor);
        map[y][x] = 4;
    }
}

/**
 * Remove bombs from a table
 * @param table A table with bombs inside
 */
function removeBombsFromTable(table) {
    const tableWithoutBombs = [];
    table.forEach(function (element) {
        const x = element[0];
        const y = element[1];
        if (bombs[y][x] != 1) {
            tableWithoutBombs.push(element);
        }
    });
    return tableWithoutBombs;

}

/**
 * Count the bombs around a tile
 * @param {Object} tile A tile
 * @param {int} x The x coordinate
 * @param {int} y The y coordinate
 * @return {int} The number of bombs around a tile
 */
function countBombsAround(adjacentTiles) {
    let number = 0;
    for (let i = 0; i < adjacentTiles.length; i++) {
        const x = adjacentTiles[i][0];
        const y = adjacentTiles[i][1];
        if (bombs[y][x] == 1)
            number += 1;
    }
    return number;
}

/**
 * Put a flag on a tile
 * @param tile A tile
 * @param x The x coordinate
 * @param y The y coordinate
 */
function flagTile(tile, x, y) {
    if (map[y][x] == 2) {
        const id = tile.attr('id');
        $('#' + id + " img").remove();
        setMinesLabel(++bombsNumber);
        map[y][x] = 0;
    } else {
        tile.append("<img class='center-img' src=\"img/flag/1.png\" alt=\"flag\">");
        setMinesLabel(--bombsNumber);
        map[y][x] = 2;
    }
}

/**
 * Increase the timer
 */
function increaseTimer() {
    let seconds = parseInt($("#time").text());
    seconds += 1;
    if (seconds > 999)
        loose();
    if (seconds < 10)
        $("#time").text("00" + seconds);
    else if (seconds < 100)
        $("#time").text("0" + seconds);
    else
        $("#time").text(seconds);
    return 0;
}

/**
 * Set the mines label
 * @param n The number of bombs remaining
 */
function setMinesLabel(n) {
    if (n < 10)
        $("#mines").text("00" + n);
    else if (n < 100)
        $("#mines").text("0" + n);
    else
        $("#mines").text(n);
}

/**
 * Reveal all bombs
 */
function showAllBombs() {
    for (let i = 0; i < bombs.length; i++) {
        for (let j = 0; j < bombs[i].length; j++) {
            if (bombs[i][j] == 1) {
                $("#tx" + j + "y" + i + " img").remove();
                const tile = $("#tx" + j + "y" + i);
                tile.css('background', bombBackgroundColor);
                tile.append("<img class='center-img' src=\"img/mines/1.png\" alt=\"mine\">");
            }
        }
    }
}

/**
 * Loose the game
 */
function loose() {
    showAllBombs();
    $("#flagIndicator").css('opacity', 0);
    setTimeout(function () {
        gameOver(0);
    }, 1000);
}

/**
 * Game over with a reason
 * @param reason The reason of the game over
 */
function gameOver(reason) {
    clearInterval(timer);
    var condition = false;
    if (reason == 0) {
        condition = !alert("You loose 😭");
    } else if (reason == 1) {
        condition = !alert("You win !!! 😁");
    }
    if (condition)
        window.location.reload();
}

/**
 * Check if the user has won the game
 */
function hasWon() {
    var condition = true;
    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if ((map[i][j] == 2 && bombs[i][j] != 1) || (map[i][j] != 2 && bombs[i][j] == 1)) {
                condition = false;
            }
        }
    }
    if (condition) {
        $("#smiley").attr('src', 'img/love/' + random(1, 2) + '.png');
        setTimeout(function () {
            gameOver(1);
        }, 200);
    }
}
