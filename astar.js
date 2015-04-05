/**
 * @author Eric Hsieh 2015
 */

'Use Strict'

/**
 * @namespace AStar
 */
var AStar = AStar || {};

/**
 * Simple tile object
 *
 * @constructor
 * @param {int} x
 * @param {int} y
 * @param {boolean} blocked
 */
AStar.Tile = function(x, y, blocked) {

  this.x = x;
  this.y = y;	
  this.blocked = blocked;

  // Varying tile weights can be used to simulate different terrain types
  this.weight = 1;
  this.reset();
};

/**
 * Reset the tile properties that are used during pathfinding
 * 
 * @method AStar.Tile#reset
 */
AStar.Tile.prototype.reset = function() {
	
  // Cost from start tile
  this.gCost = 0;

  // Estimated cost to goal tile based on heuristic function
  this.hCost = 0;

  // fCost = gCost + hCost - lowest fCost tiles are examined first by algorithm
  this.fCost = 0;

  this.visited = false;
  this.closed = false;
  this.parent = null;	
};

/**
 * Compares positions of 2 tiles
 *
 * @method AStar.Tile#samePositionAs
 */
AStar.Tile.prototype.samePositionAs = function(tile) {

  return (this.x === tile.x && this.y === tile.y);
};

/**
 * Tile map object represented as 2d array of tile objects
 *
 * @constructor
 * @param {int} width - # of x tiles in map
 * @param {int} height - # of y tiles in map
 * @param {int} tileWidth - tile width in pixels
 * @param {int} tileHeight - tile height in pixels
 */
AStar.TileMap = function(width, height, tileWidth, tileHeight) {

  this.width = width;
  this.height = height;	
  this.tileWidth = tileWidth;
  this.tileHeight = tileHeight;
  this.tiles = [];
  var innerData;

  for (var i = 0; i < this.height; i++) {
    innerData = [];

    for (var j = 0; j < this.width; j++) {
      if (Math.random() > 0.75) {
        innerData.push(new AStar.Tile(i, j, true));
      } else {
        innerData.push(new AStar.Tile(i, j, false));
      } 
    }

    this.tiles.push(innerData);
  }
};

/**
 * Reset all tiles in the map
 *
 * @method AStar.TileMap#reset
 */
AStar.TileMap.prototype.reset = function() {

  for (var i = 0; i < this.width; i++) {
    for (var j = 0; j < this.height; j++) {
      this.tiles[i][j].reset();
    }
  }
};

/**
 * Returns valid neighbor tiles of the given tile position
 * 
 * @param {int} x
 * @param {int} y
 * @returns {AStar.Tile[]}
 */
AStar.TileMap.prototype.getNeighbors = function(x, y) {

  var neighbors = [];

  // West
  if (this.tiles[x - 1] && this.tiles[x - 1][y] && !this.tiles[x - 1][y].blocked) {
    neighbors.push(this.tiles[x -1][y]);
  }

  // East
  if (this.tiles[x + 1] && this.tiles[x + 1][y] && !this.tiles[x + 1][y].blocked) {
    neighbors.push(this.tiles[x + 1][y]);
  }

  // South
  if (this.tiles[x] && this.tiles[x][y - 1] && !this.tiles[x][y - 1].blocked) {
    neighbors.push(this.tiles[x][y - 1]);
  }

  // North
  if (this.tiles[x] && this.tiles[x][y + 1] && !this.tiles[x][y + 1].blocked) {
    neighbors.push(this.tiles[x][y + 1]);
  }

  return neighbors;
};

/**
 * Execute A * algorithm
 *
 * @function findPath
 * @param {AStar.TileMap} tileMap
 * @param {AStar.Tile} startTile
 * @param {AStar.Tile} goalTile
 * @returns {AStar.Tile[]} - path found as array of tiles from startTile to goalTile
 */
AStar.findPath = function(tileMap, startTile, goalTile) {

  var path = [];
  var openList = [];

  tileMap.reset();

  openList.push(startTile);

  while (openList.length > 0) {

    // Find the open node with the lowest fCost
    var lowIndex = 0;
    for (var i = 0; i < openList.length; i++) {

      if (openList[i].fCost < openList[lowIndex].fCost) {
        lowIndex = i;
      }
    }

    var currentTile = openList.splice(lowIndex, 1)[0];

    // End case: found goal tile
    if (currentTile.samePositionAs(goalTile)) {
      var current = currentTile;
      while (current.parent) {
        path.push(current);
        current = current.parent;			
      }

      // Returning path array needs to be in order: startTile to goalTile
      path.push(startTile);			
      return path.reverse();
    }

    currentTile.closed = true;

    // Normal case: expand to neighboring tiles
    var neighbors = tileMap.getNeighbors(currentTile.x, currentTile.y);

    for (var j = 0; j < neighbors.length; j++) {
      var neighbor = neighbors[j];

      if (neighbor.closed || neighbor.blocked) {
        continue;
      }

      var gCost = currentTile.gCost + neighbor.weight;

      /** 
       * If the current path to this neighbor tile is lower than what we've seen so far, 
       * then we should adjust the this neighbor tile to use the current path by updating
       * its parent and gCost
       */
      if (!neighbor.visited || gCost < neighbor.gCost) {

        if (!neighbor.visited) {
          openList.push(neighbor);
        }

        neighbor.visited = true;
        neighbor.parent = currentTile;
        neighbor.hCost = this.heuristic(neighbor, goalTile);
        neighbor.gCost = gCost;
        neighbor.fCost = neighbor.gCost + neighbor.hCost;					
      }
    }	
  }

  return path;
};

/**
 * Heuristic function for estimating cost of path between 2 tiles
 * 
 * @function heuristic
 * @param {AStar.Tile} startTile
 * @param {AStar.Tile} goalTile
 */
AStar.heuristic = function(startTile, goalTile) {

  // Manhattan Distance
  return Math.abs(goalTile.x - startTile.x) + Math.abs(goalTile.y - startTile.y);
};

/**
 * Main object for demonstrating A * pathfinding visually
 *
 * @constructor
 * @param {canvas} canvas - canvas object for rendering the tile map
 * @param {int} mapWidth - # of x tiles in map
 * @param {int} mapHeight - # of y tiles in map
 * @param {int} tileWidth - tile width in pixels
 * @param {int} tileHeight - tile height in pixels
 */
AStar.Demo = function(canvas, mapWidth, mapHeight, tileWidth, tileHeight) {

  this.canvas = canvas;
  this.context = this.canvas.getContext('2d');
  this.canvas.width = mapWidth * tileWidth;
  this.canvas.height = mapHeight * tileHeight;
  this.tileMap = new AStar.TileMap(mapWidth, mapHeight, tileWidth, tileHeight);	
};

/**
 * Click handler for canvas.  Clicking on an open tile executes the pathfinding
 * algorithm using the last goal tile as the start tile, and the clicked tile as
 * the new goal tile
 * 
 * @method AStar.Demo#onCanvasClick
 * @param e
 */
AStar.Demo.prototype.onCanvasClick = function(e) {

  var x;
  var y;
  
  if (e.pageX != undefined && e.pageY != undefined) {
    x = e.pageX;
    y = e.pageY;
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  
  // make them relative to the canvas only
  x -= this.canvas.offsetLeft;
  y -= this.canvas.offsetTop;
    
  var tileClicked = this.tileMap.tiles[Math.floor(x / this.tileMap.tileWidth)][Math.floor(y / this.tileMap.tileHeight)];  

  if (!tileClicked.blocked) {
    var path = AStar.findPath(this.tileMap, this.startTile, tileClicked);

    this.renderTileMap();
    this.renderPath(path);

    this.startTile = tileClicked;
  }
};

/** 
 * Load the demo with default start tile
 * 
 * @method AStar.Demo#load
 */
AStar.Demo.prototype.load = function() {
	
  // Make 0,0 the default starting tile
  this.tileMap.tiles[0][0].blocked = false;
  this.startTile = this.tileMap.tiles[0][0];

  this.renderTileMap();	
  this.renderPath([this.startTile]);

  // Need to use bind here so 'this' will reference the Demo instead of the canvas
  this.canvas.addEventListener('click', this.onCanvasClick.bind(this), false);
};

/**
 * Draws the tile map to the canvas
 *
 * @method AStar.Demo#renderTileMap
 */
AStar.Demo.prototype.renderTileMap = function() {

  this.context.clearRect (0 , 0 , this.canvas.width, this.canvas.height);
  this.context.strokeStyle = 'black';

  for (var i = 0; i < this.tileMap.width; i++) {
    for (var j = 0; j < this.tileMap.height; j++) {
		
      if (this.tileMap.tiles[i][j].blocked) {	

        // Blocked tiles are black
        this.context.fillStyle = 'black';
        this.context.fillRect(i * this.tileMap.tileWidth, 
          j * this.tileMap.tileHeight, 
          this.tileMap.tileWidth, 
          this.tileMap.tileHeight);

			} else if (this.tileMap.tiles[i][j].closed) {			

        // Closed tiles are orange
        this.context.fillStyle = 'orange';
        this.context.fillRect(i * this.tileMap.tileWidth, 
          j * this.tileMap.tileHeight, 
          this.tileMap.tileWidth, 
          this.tileMap.tileHeight);

      } else if (this.tileMap.tiles[i][j].visited) {			

        // Visited tiles are grey
        this.context.fillStyle = 'grey';
        this.context.fillRect(i * this.tileMap.tileWidth, 
          j * this.tileMap.tileHeight, 
          this.tileMap.tileWidth, 
          this.tileMap.tileHeight);
      } 

      // Draw border for all tiles
      this.context.strokeRect(i * this.tileMap.tileWidth, 
        j * this.tileMap.tileHeight, 
        this.tileMap.tileWidth, 
        this.tileMap.tileHeight);			
    }
  }	
};

/**
 * Render the given array of tiles
 * 
 * @method AStar.Demo#renderPath
 * @param {AStar.Tile[]} path
 */
AStar.Demo.prototype.renderPath = function(path) {
  
  this.context.strokeStyle = 'black';
  for (var i = 0; i < path.length; i++) {

    this.context.fillStyle = 'red';

    if (i == 0) {
      // Start tile is yellow
      this.context.fillStyle = 'yellow';
    } else if (i == path.length - 1) {
      // Goal tile is green
      this.context.fillStyle = 'green';
    }

    this.context.fillRect(path[i].x * this.tileMap.tileWidth,
      path[i].y * this.tileMap.tileHeight,
      this.tileMap.tileWidth,
      this.tileMap.tileHeight);

    this.context.strokeRect(path[i].x * this.tileMap.tileWidth,
      path[i].y * this.tileMap.tileHeight,
      this.tileMap.tileWidth,
      this.tileMap.tileHeight);
  }
};