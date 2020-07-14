if (typeof buildfire == "undefined")
  throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};

class Stars {
  constructor(containerSelector, options) {
    this.containerSelector = containerSelector;
    this.options = options;
  }

  emptyStar = "☆";
  fullStar = "★";

  render() {
    const starsContainer = document.querySelector(this.containerSelector);
    if (!starsContainer)
      return console.error(
        `Container element ${this.containerSelector} not found in DOM`
      );

    this.getStarsUI().forEach(star => {
      console.log(star)
      starsContainer.appendChild(star)
    });
  }

  getStarsUI() {
    let that = this;
    let stars = [];
    for (let i = 0; i < 5; i++) {
      let star = document.createElement("div");
      star.id = `star${i}`;
      star.addEventListener("click", function () {
        let starIndex = Number(star.id.slice(4));
        for (let i = 0; i < 5; i++) {
          document.getElementById(`star${i}`).innerHTML =
            i <= starIndex ? that.fullStar : that.emptyStar;
        }
      });
      star.innerHTML = this.emptyStar;
      stars.push(star)
    }
    return stars;
  }


}

class Reviews {}

class Rating {
  constructor(record = {}) {
    if (!record.data) record.data = {};
    this.id = record.id || undefined;
    this.isActive =
      typeof record.data.isActive === "boolean" ? record.data.isActive : true;
    this.createdOn = record.data.createdOn || undefined;
    this.createdBy = record.data.createdBy || undefined;
    this.lastUpdatedOn = record.data.lastUpdatedOn || undefined;
    this.lastUpdatedBy = record.data.lastUpdatedBy || undefined;
    this.deletedOn = record.data.deletedOn || undefined;
    this.deletedBy = record.data.deletedBy || undefined;

    this.user = record.data.user || {
      id: "",
      displayName: "",
      image: "",
    };
    this.ratingId = record.data.ratingId || undefined;
    this.rating = record.data.rating || undefined;
    this.comment = record.data.comment || "";
    this.images = record.data.images || [];
  }

  /**
   * Get instance ready for data access with _buildfire index object
   */
  toJSON() {
    return {
      id: this.id,
      isActive: this.isActive,
      createdOn: this.createdOn,
      createdBy: this.createdBy,
      lastUpdatedOn: this.lastUpdatedOn,
      lastUpdatedBy: this.lastUpdatedBy,
      deletedOn: this.deletedOn,
      deletedBy: this.deletedBy,

      user: this.user,
      ratingId: this.ratingId,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      _buildfire: {
        index: {
          number1: this.isActive ? 1 : 0,
          date1: this.createdOn,
          array1: [this.rating],
          string1: this.ratingId,
        },
      },
    };
  }
}


class Summary {
  constructor(record = {}) {
    if (!record.data) record.data = {};
    this.id = record.id || undefined;

    this.ratingId = record.data.ratingId || null;
    this.count = record.data.count || 0;
    this.total = record.data.total || 0
  }

  /**
   * Get instance ready for data access with _buildfire index object
   */
  toJSON() {
    return {
      id: this.id,
      ratingId: this.ratingId,
      count: this.count,
      total: this.total,
      _buildfire: {
        index: {
          string1: this.ratingId,
        }
      }
    };
  }
}  


class Ratings {
  /**
   * Get Database Tag
   */
  static get TAG() {
    return "rating";
  }

  /**
   * Get List Of Ratings
   * @param {Object} filters Filters object with search operators
   * @param {Function} callback Callback function
   */
  static search(filters, callback) {
    buildfire.appData.search(filters, Ratings.TAG, (err, records) => {
      if (err) return callback(err);
      return callback(
        null,
        records.map((record) => new Rating(record))
      );
    });
  }
  /**
   * Add new rating
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static add(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.createdBy = authManager.currentUser._id;
    rating.createdOn = new Date();

    buildfire.appData.insert(
      rating.toJSON(),
      Ratings.TAG,
      false,
      (err, record) => {
        if (err) return callback(err);
        return callback(null, new Rating(record));
      }
    );
  }
  /**
   * Edit single rating instance
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static set(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.lastUpdatedOn = new Date();
    rating.lastUpdatedBy = authManager.currentUser._id;

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        return callback(null, new Rating(record));
      }
    );
  }
  /**
   * Delete single rating instance
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static del(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.deletedBy = authManager.currentUser._id;
    rating.deletedOn = new Date();
    rating.isActive = false;

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        return callback(null, new Rating(record));
      }
    );
  }
}

buildfire.components.ratingSystem = {
  stars: Stars,
  reviews: Reviews,
};