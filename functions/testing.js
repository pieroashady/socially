const squareDigits = (num) => {
  if (typeof num !== 'number') {
    return console.log('Please provide a number');
  }

  let convertedNum = num.toString();
  let nums = [];

  for (let i = 0; i < convertedNum.length; i++) {
    nums.push(Math.pow(parseInt(convertedNum[i]), 2));
  }

  let removeComma = nums.toString().split(',').join('');
  console.log(removeComma);
};

squareDigits(9119);

const simpleSquare = (num) => {
  if (typeof num !== 'number') {
    return console.log('Please provide a number');
  }

  let ex = num.toString().split('');
  return ex
    .map((x) => {
      return x * x;
    })
    .join('');
};

simpleSquare(9119);
