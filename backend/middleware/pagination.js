const pagination = (model, populate, selectFields) => async (req, res, next) => {
  let query;

  query = model.find()

  console.log(req.query);
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Populate
  if (populate) {
    // If `populate` is an object, use it as options for `populate()`
    if (typeof populate === 'object') {
      query = query.populate({ path: populate.path, select: selectFields.join(' ') });
    } else {
      query = query.populate(populate);
    }
  }

  // Pagination
  const page = Number(req.query.page) || 1;
  const pageSize = 8;

  // Count total documents matching the query criteria, including keyword search
  const total = await model.countDocuments();

  // Skip and limit for pagination
  query = query.skip(pageSize * (page - 1)).limit(pageSize);

  // Execute the query
  const results = await query;

  // Calculate total number of pages
  const pages = Math.ceil(total / pageSize);

  // Add results to the response object
  res.advancedResults = {
    data: results,
    total,
    page,
    pages
  };

  next();

}

export default pagination