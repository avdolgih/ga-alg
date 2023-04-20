console.log(getDay());
console.log(Date.UTC(2023, 3, 20, 0, 0, 0, 0) / 86400000);
console.log(Date.UTC(2023, 3, 21) / 86400000);


function getDay() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  console.log(offset);
  return (date.getTime() - offset) / 86400000;
}