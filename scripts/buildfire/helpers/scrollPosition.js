if (typeof buildfire == "undefined")
  throw "please add buildfire.js first to use buildfire helpers";
if (typeof buildfire.helpers == "undefined") buildfire.helpers = {};

function debounce(func, wait) {
  let timeout;
  return function () {
    let context = this,
      args = arguments;
    let later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

buildfire.helpers.rememberScrollPosition = function (id) {
  let element = document.getElementById(id);
  if (!element) return console.warn(`Element with id "${id}" not found`);
  element.addEventListener(
    "scroll",
    debounce(() => {
      buildfire.localStorage.setItem("scrollTop", document.body.scrollTop);
    }, 500)
  );
};

buildfire.helpers.restoreScrollPosition = function (id) {
  let element = document.getElementById(id);
  if (!element) return console.warn(`Element with id "${id}" not found`);
  buildfire.localStorage.getItem("scrollTop", (err, scrollTop) => {
    element.scrollTop = scrollTop || 0;
  });
};
