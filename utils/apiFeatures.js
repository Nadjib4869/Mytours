class APIFeatures {
  constructor(query, queryString) {
    //? query == queryOgj == document(Tour), queryString == query(?page=2)
    this.query = query;
    this.queryString = queryString;
  }
  //? BUILD QUERY

  filter() {
    //* 1.1) Filtering
    const queryObj = { ...this.queryString }; //? Destructuring the query object
    const excludedFields = ["page", "sort", "limit", "fields"]; //? Fields that are not part of the query (pagination(page,limit), sorting(sort), limiting(field), aliasing(limit,sort))
    excludedFields.forEach(el => delete queryObj[el]); //? Deleting the excluded fields from the query object

    //* 1.2) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); //* regular expressions (\b : to match exactly these words, /g : to apply it not only on the first occurrence)

    this.query = this.query.find(JSON.parse(queryStr)); //? returns a query

    return this; //? to return the entire object and enable chaining in the query execution
  }

  sort() {
    //* 2) Sorting
    if (this.queryString.sort) {
      //? query = query.sort(req.query.sort)
      //? the following is to use second criteria (in case same price what to put first)
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); //? descending order
    }

    return this;
  }

  limitFields() {
    //* 3) Field Limiting
    if (this.queryString.fields) {
      //? query = query.select("name duration price")
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields); //? projecting
    } else {
      this.query = this.query.select("-__v"); //? to get everything except the v field (hna ya tdir inclusion ya tdir exclution machi les deux 3la derba)
    }

    return this;
  }

  paginate() {
    //* 4) Pagination
    //? nbrPages = results / limit(res per page)
    //? query = query.skip(limit*page-limit).limit(limit)
    const page = this.queryString.page * 1 || 1; //* str to nbr
    const limit = this.queryString.limit * 1 || 100;
    this.query = this.query.skip(limit * page - limit).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
