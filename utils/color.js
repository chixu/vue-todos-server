function randomColor() {
  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var h = randomInt(0, 360);
  var s = randomInt(70, 95);
  var l = randomInt(30, 70);
  return `hsl(${h},${s}%,${l}%)`;
};

module.exports = {
  randomColor: randomColor
}