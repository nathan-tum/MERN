const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter the product name'],
    trim: true,
    maxLength: [100, 'Characters should not exceed 100'],
  },
  price: {
    type: Number,
    required: [true, 'Please enter the product price'],
    maxLength: [5, 'Characters should not exceed 5'],
    default: 0.0,
  },
  description: {
    type: String,
    required: [true, 'Please enter description'],
  },
  ratings: {
    type: Number,
    default: 0.0,
  },

  // images: [
  //   {
  //     public_id: {
  //       type: String,
  //       required: true,
  //     },
  //     url: {
  //       type: String,
  //       required: true,
  //     },
  //   },
  // ],
  category: {
    type: String,
    required: [true, 'Please enter the category of the product.'],
    enum: {
      values: ['phones', 'laptops', 'tvs', 'cameras'],
      message: 'Please select correct category.',
    },
  },
  stock: {
    type: Number,
    required: [true, 'Enter stock number.'],
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true,
      },
      name: {
        type: String,
        required: [true, 'Name the review.'],
      },
      rating: {
        type: Number,
        required: true,
        default: 0,
      },
    },
  ],
})

module.exports = mongoose.model('product', productSchema)
