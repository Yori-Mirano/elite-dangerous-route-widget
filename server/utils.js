exports.getDistance = (positionA, positionB) => {
  return Math.sqrt(
    Math.pow(positionA[0] - positionB[0], 2)
    + Math.pow(positionA[1] - positionB[1], 2)
    + Math.pow(positionA[2] - positionB[2], 2)
  );
}