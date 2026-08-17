window.addEventListener("load", () => {
  // variables:
  const canvas = document.querySelector(".game-board");
  const canvasContext = canvas.getContext("2d");

  const worldAnchor2D = { x: 0, y: 0 };
  const worldSize2D = { width: window.innerWidth, height: window.innerHeight };
  const cellSize2D = { width: 30, height: 30 };

  // dynamic canvas & cell resizing
  const resizeCanvas = () => {
    canvas.width = worldSize2D.width;
    canvas.height = worldSize2D.height;
    // calculate uniform square cell size scaled to ratio units
    const baseCellSize = Math.min(
      canvas.width / worldSize2D.width,
      canvas.height / worldSize2D.height,
    );

    cellSize2D.width = baseCellSize;
    cellSize2D.height = baseCellSize;

    if (world) world.render(canvasContext);
  };

  // camera state:
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let anchorAtDragStart = { x: 0, y: 0 };
  let hasDragged = false;

  const stateChecker = {
    // enforces cell state rules:
    // (1) neighbour count < 2 ==> death (unpopulated)
    // (2) neighbour count > 3 ==> death (over-populated)
    // (3) neighbour count between 2 & 3 ==> same state
    // (4) neighbour count == 3 && state == dead ==> live (reproduction)
    shouldSurvive: function (liveNeighbourCount) {
      return liveNeighbourCount === 2 || liveNeighbourCount === 3;
    },
    shouldArise: function (liveNeighbourCount) {
      return liveNeighbourCount === 3;
    },
  };

  const cell = (posY) => {
    return { y: posY };
  };
  const col = (posX, liveCells = []) => {
    return {
      x: posX,
      cells: liveCells,

      // functions:
      addCell: function (posY) {
        // add if does not exist
        let currCell = this.cells.find((currCells) => currCells.y === posY);
        if (currCell) return currCell; // cell exists already

        currCell = cell(posY);
        this.cells.push(currCell);
        return currCell;
      },
      sortCells: function () {
        // sort accending
        this.cells.sort((cell1, cell2) => cell1.y - cell2.y);
      },
      canHaveNeighbourWithCol: function (givenCol) {
        return givenCol && Math.abs(this.x - givenCol.x) <= 1;
      },
      getCellNeighboursWithCol: function (cellIndex, givenCol) {
        // assume sorted.
        if (!this.canHaveNeighbourWithCol(givenCol)) return []; // no neighbours
        const currentCell = this.cells[cellIndex];
        if (!currentCell) return []; // no cell - argo: no neighbours

        // fillter from cells array to return only neighbours:
        return givenCol.cells.filter((cellOfGivenCol) => {
          const distY = Math.abs(currentCell.y - cellOfGivenCol.y),
            distX = Math.abs(this.x - givenCol.x),
            isSameCell = distX === 0 && distY === 0;

          return distY <= 1 && !isSameCell; //
        });
      },
    };
  };
  const population = () => {
    return {
      cols: [],

      // functions:
      addCol: function (posX) {
        // add if does not exist
        let currCol = this.cols.find((currCol) => currCol.x === posX);
        if (currCol) return currCol; // column exists already

        currCol = col(posX);
        this.cols.push(currCol);
        return currCol;
      },
      addCell: function (posX, posY) {
        // add if does not exist
        const currCol = this.addCol(posX); // will add only if there wasn't any
        return currCol.addCell(posY); // return created/found cell
      },
      sortCols: function () {
        this.cols.sort((col1, col2) => col1.x - col2.x);
        return this;
      },
      sortCells: function () {
        this.cols.forEach((currCol) => currCol.sortCells());
        return this;
      },
      sort: function () {
        return this.sortCells().sortCols();
      },
      getCellNeighbours: function (colIndex, cellIndex) {
        // assume sorted.
        const givenCol = this.cols[colIndex];
        if (!givenCol) return []; // no col - argo: no neighbours

        let neighbours = [];
        for (let i = colIndex - 1; i <= colIndex + 1; i++) {
          if (this.cols[i] && givenCol.canHaveNeighbourWithCol(this.cols[i])) {
            neighbours = neighbours.concat(
              givenCol.getCellNeighboursWithCol(cellIndex, this.cols[i]),
            );
          }
        }

        return neighbours;
      },
      // TODO - reconstruct & fix & remake ==>
      nextGeneration: function () {
        // assume sorted
        const nextPop = population();
        const neighborCounts = new Map();

        // Evaluate live cells and record neighbor counts for dead cell reproduction
        this.cols.forEach((currCol, colIndex) => {
          currCol.cells.forEach((currCell, cellIndex) => {
            const liveNeighbours = this.getCellNeighbours(colIndex, cellIndex);
            if (stateChecker.shouldSurvive(liveNeighbours.length)) {
              nextPop.addCell(currCol.x, currCell.y);
            }

            for (let distX = -1; distX <= 1; distX++) {
              for (let distY = -1; distY <= 1; distY++) {
                if (distX === 0 && distY === 0) continue; // skip current cell
                const key = `${currCol.x + distX},${currCell.y + distY}`;
                neighborCounts.set(key, (neighborCounts.get(key) || 0) + 1);
              }
            }
          });
        });

        // Evaluate dead cells for reproduction
        neighborCounts.forEach((count, key) => {
          if (stateChecker.shouldArise(count)) {
            const [x, y] = key.split(",").map(Number);
            nextPop.addCell(x, y);
          }
        });

        return nextPop.sort();
      },
      render: function (context) {
        context.clearRect(0, 0, worldSize2D.width, worldSize2D.height);

        // Grid lines
        // context.strokeStyle = "#e0e0e0";
        // for (let x = 0; x <= worldSize2D.width; x += cellSize2D.width) {
        //   context.beginPath();
        //   context.moveTo(x, 0);
        //   context.lineTo(x, worldSize2D.height);
        //   context.stroke();
        // }
        // for (let y = 0; y <= worldSize2D.height; y += cellSize2D.height) {
        //   context.beginPath();
        //   context.moveTo(0, y);
        //   context.lineTo(worldSize2D.width, y);
        //   context.stroke();
        // }

        // Live cells inside canvas bounds
        context.fillStyle = "#222222";
        this.cols.forEach((currCol) => {
          currCol.cells.forEach((currCell) => {
            const drawX = (currCol.x - worldAnchor2D.x) * cellSize2D.width;
            const drawY = (currCell.y - worldAnchor2D.y) * cellSize2D.height;

            if (
              drawX >= 0 &&
              drawX < worldSize2D.width &&
              drawY >= 0 &&
              drawY < worldSize2D.height
            ) {
              context.fillRect(
                drawX,
                drawY,
                cellSize2D.width,
                cellSize2D.height,
              );
            }
          });
        });
      },
    };
  };

  // TODO - reconstruct & fix & remake ==>
  // init canvas size:
  canvas.width = worldSize2D.width;
  canvas.height = worldSize2D.height;

  // initial seed (Glider pattern):
  let world = population();
  const max = 1000;
  for (let i = 0, j = 0; j < max; i++) {
    if (i === max - 1) {
      i = 0;
      j++;
    }
    if (Math.random() > 0.75) {
      world.addCell(i, j);
    }
  }
  world.sort();

  resizeCanvas(); // init canvas

  // loop farme:
  function tick() {
    world.render(canvasContext);
    world = world.nextGeneration();
  }

  // events:
  window.addEventListener("contextmenu", (e) => e.preventDefault()); // make right click dropdown menu disabled on canves
  window.addEventListener("keydownb", (e) => {
    if (e.code === "Space") {
      requestAnimationFrame(tick);
    }
  });
  canvas.addEventListener("click", (e) => {
    if (hasDragged) return;

    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor(
      (e.clientX - rect.left) / cellSize2D.width + worldAnchor2D.x,
    );
    const cellY = Math.floor(
      (e.clientY - rect.top) / cellSize2D.height + worldAnchor2D.y,
    );

    world.addCell(cellX, cellY).sort();
    world.render(canvasContext);
  }); // draw controls
  window.addEventListener("resize", resizeCanvas); // resize listener
  // camera controls - panning ==>
  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    hasDragged = false;
    dragStart = { x: e.clientX, y: e.clientY };
    anchorAtDragStart = { x: worldAnchor2D.x, y: worldAnchor2D.y };
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged = true;
    }

    worldAnchor2D.x = anchorAtDragStart.x - dx / cellSize2D.width;
    worldAnchor2D.y = anchorAtDragStart.y - dy / cellSize2D.height;
    world.render(canvasContext);
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
  // camera controls - focus & zoom ==>
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldMouseX = worldAnchor2D.x + mouseX / cellSize2D.width;
    const worldMouseY = worldAnchor2D.y + mouseY / cellSize2D.height;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newSize = Math.max(5, Math.min(100, cellSize2D.width * zoomFactor));

    cellSize2D.width = newSize;
    cellSize2D.height = newSize;

    worldAnchor2D.x = worldMouseX - mouseX / cellSize2D.width;
    worldAnchor2D.y = worldMouseY - mouseY / cellSize2D.height;

    world.render(canvasContext);
  });
});
