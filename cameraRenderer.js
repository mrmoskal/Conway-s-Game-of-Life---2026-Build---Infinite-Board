const canvas = document.querySelector(".render-window"); // default canvas element for debug. must give canvas & context in usage.
const canvasContext = canvas.getContext("2d"); // this camera render logic is built for 2d canvas context, for a 'grid-based view with infinite board'.

export const gridConfig = {
  // cell size
  cellWidth: 50,
  cellHeight: 50,

  //   // camera offset
  //   cameraOffsetX: canvas.width / this.cellWidth / 2,
  //   cameraOffsetY: canvas.height / this.cellHeight / 2,

  //   // update offset values when canvas size changes
  //   updateCameraOffset: () => {
  //     this.cameraOffsetX = canvas.width / this.cellWidth / 2;
  //     this.cameraOffsetY = canvas.height / this.cellHeight / 2;
  //   },

  //   // set cell size:
  //   setCellWidth: (newCellWidth) => {
  //     this.cellWidth = newCellWidth;
  //     this.updateCameraOffset();
  //   },
  //   setCellHeight: (newCellHeight) => {
  //     this.cellHeight = newCellHeight;
  //     this.updateCameraOffset();
  //   },
  //   setCellSize: (newCellWidth, newCellHeight) => {
  //     this.cellWidth = newCellWidth;
  //     this.cellHeight = newCellHeight;
  //     this.updateCameraOffset();
  //   },
};

export const rendererCameraData = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const gridRenderStyleConfig = {
  // cell render style:
  cellIsBorder: false,
  cellBorderColor: "grey",
  cellColorTypes: ["single-color", "gradient", "image", "animated"],
  cellCurrColorTypeIndex: 0,
  cellColor: "white",
  cellGradient: {
    degree: "45deg",
    colors: ["white", "lightgray", "gray", "darkgray"],
    gradiantTypes: ["linear", "radial", "conic"],
    gradiantTypeIndex: 0,
  },

  // grid render style:
  gridIsShowLines: true,
  gridLineColor: "black",
};

function cellScaleCorrection(x, y, canvas, gridConfig, cameraData) {
  // convert raw cell coordinates (always difference on 1 unit of space between cells) to corrected cordinate per cell size and camera zoom.
  const { cellWidth, cellHeight } = gridConfig;
  const zoom = cameraData.zoom || 0.1; // min zoom value.
}

function drawGridLines(
  canvas,
  canvasContext,
  gridConfig,
  cameraData,
  gridLineColor,
) {
  // draw grid lines on canvas for each frame.
  const { cellWidth, cellHeight } = gridConfig;
  const { x: cameraX, y: cameraY, zoom } = cameraData;

  canvasContext.strokeStyle = gridLineColor;
}

export default function render(
  canvas,
  canvasContext,
  positionsGrid,
  gridConfig,
  gridRenderStyleConfig,
  cameraData,
) {
  // draw render on canvas for each frame.
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.strokeStyle = gridRenderStyleConfig.gridLineColor;
}
