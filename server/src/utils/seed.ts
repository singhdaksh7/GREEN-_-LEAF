/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { toSlug } from './slug';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Coupon } from '../models/Coupon';
import { BlogPost } from '../models/BlogPost';
import { SiteSettings } from '../models/SiteSettings';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber';
import { generateProductImage, generateCategoryImage, generateBannerImage } from './placeholderImage';

const CATEGORY_EMOJI: Record<string, string> = {
  'Soil & Fertilizers': '🌱',
  'Organic Fertilizers': '🧴',
  'Potting Mix': '🪴',
  Cocopeat: '🧱',
  'Soil Additives': '⚗️',
  'Plant Food': '🧪',
  'Pest Control': '🐞',
  'Pots & Planters': '🪴',
  'Plastic Pots': '🪴',
  'Ceramic Pots': '🏺',
  'Metal Planters': '🛢️',
  'Grow Bags': '🛍️',
  'Hanging Planters': '🧺',
  'Indoor Planters': '🌿',
  'Gardening Accessories': '🧰',
  'Gardening Tools': '🛠️',
  'Watering Equipment': '🚿',
  Composters: '♻️',
  'Plant Support': '🎋',
  'Seedling Trays': '🌱',
  Accessories: '🧤',
  Seeds: '🌰',
  'Vegetable Seeds': '🥕',
  'Flower Seeds': '🌻',
  'Fruit Seeds': '🍉',
  'Herb Seeds': '🌿',
  'Seed Combos': '🌱',
  'Outdoor & Decor': '🏡',
  'Artificial Plants': '🌴',
  'Bird Feeders': '🐦',
  'Solar Lights': '☀️',
  'Garden Decor': '🎨',
};

const BLOG_CATEGORY_EMOJI: Record<string, string> = {
  'Gardening Tips': '🌱',
  'Home Gardening': '🏡',
  'Plant Care': '🪴',
  Fertilizers: '🧴',
  'DIY Gardening': '🛠️',
};

const PRODUCT_KEYWORD_EMOJI: [RegExp, string][] = [
  [/trowel|cultivator/i, '🛠️'],
  [/shears|pruning/i, '✂️'],
  [/glove/i, '🧤'],
  [/watering can/i, '🚿'],
  [/hose|spray gun/i, '🚿'],
  [/sprayer|spray\b/i, '🧴'],
  [/drip irrigation/i, '💧'],
  [/composter/i, '♻️'],
  [/trellis|stake|cage|support/i, '🎋'],
  [/tray|seedling pot/i, '🌱'],
  [/label|marker/i, '🏷️'],
  [/bird feeder/i, '🐦'],
  [/solar/i, '☀️'],
  [/gnome/i, '🎎'],
  [/stepping stone/i, '🪨'],
  [/boxwood|areca|artificial/i, '🌴'],
  [/neem|insecticidal|pest/i, '🧴'],
  [/vermicompost|compost|manure|bone meal/i, '🌾'],
  [/cocopeat/i, '🧱'],
  [/perlite|vermiculite/i, '⚗️'],
  [/potting mix|soil/i, '🪴'],
  [/grow bag/i, '🛍️'],
  [/ceramic/i, '🏺'],
  [/metal|galvanized/i, '🛢️'],
  [/hanging/i, '🧺'],
  [/tomato/i, '🍅'],
  [/chilli|chili/i, '🌶️'],
  [/marigold|sunflower/i, '🌻'],
  [/watermelon/i, '🍉'],
  [/papaya/i, '🍈'],
  [/basil|mint|herb/i, '🌿'],
  [/kit\b/i, '🧺'],
];

function getProductEmoji(name: string, subcategory: string): string {
  const match = PRODUCT_KEYWORD_EMOJI.find(([pattern]) => pattern.test(name));
  return match?.[1] ?? CATEGORY_EMOJI[subcategory] ?? '🪴';
}

const CATEGORY_TREE: Record<string, string[]> = {
  'Soil & Fertilizers': ['Organic Fertilizers', 'Potting Mix', 'Cocopeat', 'Soil Additives', 'Plant Food', 'Pest Control'],
  'Pots & Planters': ['Plastic Pots', 'Ceramic Pots', 'Metal Planters', 'Grow Bags', 'Hanging Planters', 'Indoor Planters'],
  'Gardening Accessories': ['Gardening Tools', 'Watering Equipment', 'Composters', 'Plant Support', 'Seedling Trays', 'Accessories'],
  Seeds: ['Vegetable Seeds', 'Flower Seeds', 'Fruit Seeds', 'Herb Seeds', 'Seed Combos'],
  'Outdoor & Decor': ['Artificial Plants', 'Bird Feeders', 'Solar Lights', 'Garden Decor'],
};

interface ProductSeed {
  name: string;
  subcategory: string;
  mrp: number;
  salePrice: number;
  stock: number;
  tags: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  variants?: { attributes: Record<string, string>; mrp: number; salePrice: number; stock: number }[];
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { name: 'Premium Vermicompost 5kg', subcategory: 'Organic Fertilizers', mrp: 399, salePrice: 279, stock: 120, tags: ['fertilizer', 'organic', 'compost'], bestSeller: true },
  { name: 'Neem Cake Fertilizer 1kg', subcategory: 'Organic Fertilizers', mrp: 249, salePrice: 179, stock: 90, tags: ['fertilizer', 'organic', 'neem'] },
  { name: 'Bone Meal Fertilizer 500g', subcategory: 'Organic Fertilizers', mrp: 199, salePrice: 149, stock: 80, tags: ['fertilizer', 'organic'] },
  { name: 'Rose Fertilizer Special Blend 1kg', subcategory: 'Plant Food', mrp: 299, salePrice: 219, stock: 60, tags: ['fertilizer', 'rose'], newArrival: true },
  { name: 'All Purpose Potting Mix 10kg', subcategory: 'Potting Mix', mrp: 449, salePrice: 349, stock: 100, tags: ['soil', 'potting mix'], bestSeller: true },
  { name: 'Cactus & Succulent Potting Mix 4kg', subcategory: 'Potting Mix', mrp: 299, salePrice: 229, stock: 70, tags: ['soil', 'cactus'] },
  { name: 'Premium Cocopeat Block 5kg', subcategory: 'Cocopeat', mrp: 349, salePrice: 259, stock: 85, tags: ['cocopeat', 'soil'] },
  { name: 'Perlite Soil Additive 1kg', subcategory: 'Soil Additives', mrp: 249, salePrice: 189, stock: 65, tags: ['soil', 'additive'] },
  { name: 'Vermiculite Soil Additive 1kg', subcategory: 'Soil Additives', mrp: 259, salePrice: 199, stock: 55, tags: ['soil', 'additive'] },
  { name: 'Neem Oil Pest Control Spray 250ml', subcategory: 'Pest Control', mrp: 299, salePrice: 219, stock: 110, tags: ['pest control', 'neem', 'organic'], bestSeller: true },
  { name: 'Insecticidal Soap Spray 500ml', subcategory: 'Pest Control', mrp: 349, salePrice: 269, stock: 60, tags: ['pest control'] },

  {
    name: 'Classic Round Plastic Pot',
    subcategory: 'Plastic Pots',
    mrp: 199,
    salePrice: 149,
    stock: 150,
    tags: ['pot', 'plastic'],
    bestSeller: true,
    variants: [
      { attributes: { size: 'Small', color: 'Terracotta' }, mrp: 199, salePrice: 149, stock: 50 },
      { attributes: { size: 'Medium', color: 'Terracotta' }, mrp: 299, salePrice: 229, stock: 50 },
      { attributes: { size: 'Large', color: 'Terracotta' }, mrp: 399, salePrice: 309, stock: 50 },
    ],
  },
  { name: 'Self-Watering Plastic Planter', subcategory: 'Plastic Pots', mrp: 449, salePrice: 349, stock: 70, tags: ['pot', 'plastic', 'self-watering'], newArrival: true },
  {
    name: 'Handcrafted Ceramic Planter',
    subcategory: 'Ceramic Pots',
    mrp: 899,
    salePrice: 699,
    stock: 40,
    tags: ['pot', 'ceramic', 'premium'],
    featured: true,
    variants: [
      { attributes: { color: 'White', size: 'Medium' }, mrp: 899, salePrice: 699, stock: 20 },
      { attributes: { color: 'Green', size: 'Medium' }, mrp: 899, salePrice: 699, stock: 20 },
    ],
  },
  { name: 'Glazed Ceramic Bowl Planter', subcategory: 'Ceramic Pots', mrp: 799, salePrice: 599, stock: 35, tags: ['pot', 'ceramic'] },
  { name: 'Industrial Metal Planter', subcategory: 'Metal Planters', mrp: 999, salePrice: 799, stock: 30, tags: ['pot', 'metal'], featured: true },
  { name: 'Galvanized Metal Bucket Planter', subcategory: 'Metal Planters', mrp: 649, salePrice: 499, stock: 45, tags: ['pot', 'metal'] },
  {
    name: 'Heavy Duty Grow Bag',
    subcategory: 'Grow Bags',
    mrp: 149,
    salePrice: 99,
    stock: 200,
    tags: ['grow bag', 'vegetable'],
    bestSeller: true,
    variants: [
      { attributes: { packSize: 'Pack of 1' }, mrp: 149, salePrice: 99, stock: 80 },
      { attributes: { packSize: 'Pack of 3' }, mrp: 399, salePrice: 269, stock: 60 },
      { attributes: { packSize: 'Pack of 5' }, mrp: 599, salePrice: 429, stock: 60 },
    ],
  },
  { name: 'UV Protected Grow Bag 12 inch', subcategory: 'Grow Bags', mrp: 199, salePrice: 149, stock: 100, tags: ['grow bag'] },
  { name: 'Macrame Hanging Planter', subcategory: 'Hanging Planters', mrp: 549, salePrice: 429, stock: 55, tags: ['pot', 'hanging'], newArrival: true },
  { name: 'Railing Hanging Planter Set', subcategory: 'Hanging Planters', mrp: 699, salePrice: 549, stock: 40, tags: ['pot', 'hanging'] },
  { name: 'Modern Indoor Ceramic Pot', subcategory: 'Indoor Planters', mrp: 599, salePrice: 469, stock: 60, tags: ['pot', 'indoor'] },
  { name: 'Minimalist Indoor Planter Set of 3', subcategory: 'Indoor Planters', mrp: 1199, salePrice: 899, stock: 30, tags: ['pot', 'indoor', 'set'], featured: true },

  { name: 'Gardening Tool Kit (5-Piece)', subcategory: 'Gardening Tools', mrp: 799, salePrice: 599, stock: 90, tags: ['tools', 'kit'], bestSeller: true },
  { name: 'Stainless Steel Hand Trowel', subcategory: 'Gardening Tools', mrp: 249, salePrice: 179, stock: 120, tags: ['tools', 'trowel'] },
  { name: 'Precision Pruning Shears', subcategory: 'Gardening Tools', mrp: 399, salePrice: 299, stock: 100, tags: ['tools', 'pruning'], bestSeller: true },
  { name: 'Garden Hand Cultivator', subcategory: 'Gardening Tools', mrp: 229, salePrice: 169, stock: 80, tags: ['tools'] },
  { name: 'Stainless Steel Watering Can 5L', subcategory: 'Watering Equipment', mrp: 549, salePrice: 429, stock: 70, tags: ['watering', 'can'] },
  { name: 'Adjustable Garden Hose Spray Gun', subcategory: 'Watering Equipment', mrp: 449, salePrice: 349, stock: 85, tags: ['watering', 'hose'] },
  { name: 'Drip Irrigation Kit for 20 Plants', subcategory: 'Watering Equipment', mrp: 1299, salePrice: 999, stock: 40, tags: ['watering', 'irrigation'], newArrival: true, featured: true },
  { name: 'Manual Garden Sprayer 2L', subcategory: 'Watering Equipment', mrp: 399, salePrice: 299, stock: 75, tags: ['watering', 'sprayer'] },
  { name: 'Kitchen Waste Composter Bin 30L', subcategory: 'Composters', mrp: 1599, salePrice: 1299, stock: 25, tags: ['composter'], featured: true },
  { name: 'Compact Balcony Composter', subcategory: 'Composters', mrp: 999, salePrice: 799, stock: 30, tags: ['composter'] },
  { name: 'Plant Support Stakes (Pack of 10)', subcategory: 'Plant Support', mrp: 299, salePrice: 219, stock: 100, tags: ['support', 'stakes'] },
  { name: 'Tomato Cage Plant Support', subcategory: 'Plant Support', mrp: 349, salePrice: 269, stock: 60, tags: ['support'] },
  { name: 'Seedling Tray 24-Cell (Pack of 3)', subcategory: 'Seedling Trays', mrp: 249, salePrice: 189, stock: 90, tags: ['seedling', 'tray'] },
  { name: 'Biodegradable Seedling Pots (Pack of 12)', subcategory: 'Seedling Trays', mrp: 199, salePrice: 149, stock: 100, tags: ['seedling', 'eco-friendly'] },
  { name: 'Garden Gloves (Pair)', subcategory: 'Accessories', mrp: 149, salePrice: 99, stock: 150, tags: ['accessories', 'gloves'] },
  { name: 'Plant Labels & Markers (Pack of 20)', subcategory: 'Accessories', mrp: 129, salePrice: 89, stock: 130, tags: ['accessories', 'labels'] },

  { name: 'Tomato Vegetable Seeds', subcategory: 'Vegetable Seeds', mrp: 79, salePrice: 59, stock: 200, tags: ['seeds', 'vegetable', 'tomato'], bestSeller: true },
  { name: 'Chilli Vegetable Seeds', subcategory: 'Vegetable Seeds', mrp: 69, salePrice: 49, stock: 180, tags: ['seeds', 'vegetable'] },
  { name: 'Complete Vegetable Seed Kit (10 Varieties)', subcategory: 'Vegetable Seeds', mrp: 499, salePrice: 349, stock: 60, tags: ['seeds', 'kit'], featured: true },
  { name: 'Marigold Flower Seeds', subcategory: 'Flower Seeds', mrp: 59, salePrice: 39, stock: 200, tags: ['seeds', 'flower'] },
  { name: 'Sunflower Flower Seeds', subcategory: 'Flower Seeds', mrp: 69, salePrice: 49, stock: 150, tags: ['seeds', 'flower'], newArrival: true },
  { name: 'Watermelon Fruit Seeds', subcategory: 'Fruit Seeds', mrp: 89, salePrice: 69, stock: 100, tags: ['seeds', 'fruit'] },
  { name: 'Papaya Fruit Seeds', subcategory: 'Fruit Seeds', mrp: 99, salePrice: 79, stock: 90, tags: ['seeds', 'fruit'] },
  { name: 'Basil Herb Seeds', subcategory: 'Herb Seeds', mrp: 59, salePrice: 45, stock: 140, tags: ['seeds', 'herb'] },
  { name: 'Mint Herb Seeds', subcategory: 'Herb Seeds', mrp: 59, salePrice: 45, stock: 130, tags: ['seeds', 'herb'] },
  { name: 'Kitchen Garden Seed Combo (6-Pack)', subcategory: 'Seed Combos', mrp: 349, salePrice: 249, stock: 70, tags: ['seeds', 'combo'], bestSeller: true },

  { name: 'Artificial Areca Palm Plant 4ft', subcategory: 'Artificial Plants', mrp: 1499, salePrice: 1199, stock: 25, tags: ['decor', 'artificial'] },
  { name: 'Artificial Boxwood Mat Panel', subcategory: 'Artificial Plants', mrp: 599, salePrice: 449, stock: 50, tags: ['decor', 'artificial'] },
  { name: 'Wooden Bird Feeder House', subcategory: 'Bird Feeders', mrp: 449, salePrice: 349, stock: 40, tags: ['decor', 'bird feeder'] },
  { name: 'Hanging Bird Feeder Bowl', subcategory: 'Bird Feeders', mrp: 349, salePrice: 269, stock: 55, tags: ['decor', 'bird feeder'] },
  { name: 'Solar Garden Path Lights (Pack of 4)', subcategory: 'Solar Lights', mrp: 999, salePrice: 749, stock: 45, tags: ['decor', 'solar', 'lights'], newArrival: true },
  { name: 'Solar Fairy String Lights 10m', subcategory: 'Solar Lights', mrp: 799, salePrice: 599, stock: 50, tags: ['decor', 'solar', 'lights'] },
  { name: 'Ceramic Garden Gnome Decor', subcategory: 'Garden Decor', mrp: 549, salePrice: 429, stock: 35, tags: ['decor'] },
  { name: 'Decorative Stepping Stone Set', subcategory: 'Garden Decor', mrp: 899, salePrice: 699, stock: 30, tags: ['decor'] },
];

const BLOG_SEEDS = [
  { title: '10 Easy Houseplants for Beginners', category: 'Home Gardening', excerpt: 'Start your indoor garden journey with these low-maintenance houseplants that thrive with minimal care.' },
  { title: 'How to Choose the Right Potting Mix', category: 'Plant Care', excerpt: 'Not all soil is the same. Learn how to pick the perfect potting mix for your plant type.' },
  { title: 'A Beginner Guide to Composting at Home', category: 'DIY Gardening', excerpt: 'Turn your kitchen waste into nutrient-rich compost with this simple step-by-step guide.' },
  { title: 'Understanding NPK: A Fertilizer Primer', category: 'Fertilizers', excerpt: 'Demystify fertilizer labels and learn what nitrogen, phosphorus, and potassium do for your plants.' },
  { title: 'Seasonal Gardening Tips for Indian Summers', category: 'Gardening Tips', excerpt: 'Keep your garden thriving through the heat with these practical seasonal care tips.' },
  { title: 'Growing Your Own Kitchen Herb Garden', category: 'Home Gardening', excerpt: 'A compact herb garden on your windowsill can transform your everyday cooking.' },
];

const SAMPLE_REVIEW_TEXT = [
  { title: 'Excellent quality!', description: 'The product arrived well packaged and exactly as described. Very happy with the purchase.' },
  { title: 'Great value for money', description: 'Works well and the quality feels premium for the price point.' },
  { title: 'Plants are thriving', description: 'Been using this for a few weeks now and I can already see a difference in my plants.' },
  { title: 'Fast delivery, good product', description: 'Delivered quickly and the item matches the pictures on the website.' },
  { title: 'Would recommend', description: 'Easy to use and a noticeable improvement in my garden. Will buy again.' },
];

async function seedAdmin() {
  const existing = await User.findOne({ email: 'admin@greenkart.example' });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  return User.create({
    firstName: 'Green',
    lastName: 'Admin',
    email: 'admin@greenkart.example',
    phone: '9999999999',
    passwordHash,
    role: 'SUPER_ADMIN',
  });
}

async function seedDemoCustomer() {
  const existing = await User.findOne({ email: 'customer@greenkart.example' });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('Customer@12345', 12);
  return User.create({
    firstName: 'Asha',
    lastName: 'Rao',
    email: 'customer@greenkart.example',
    phone: '9876543210',
    passwordHash,
    role: 'CUSTOMER',
  });
}

async function seedCategories() {
  const subcategoryBySlug = new Map<string, mongoose.Types.ObjectId>();
  let order = 0;

  for (const [parentName, children] of Object.entries(CATEGORY_TREE)) {
    order += 1;
    const parentSlug = toSlug(parentName);
    const parent = await Category.findOneAndUpdate(
      { slug: parentSlug },
      {
        name: parentName,
        slug: parentSlug,
        order,
        isActive: true,
        image: generateCategoryImage(parentName, CATEGORY_EMOJI[parentName] ?? '🪴'),
      },
      { upsert: true, new: true }
    );

    let childOrder = 0;
    for (const childName of children) {
      childOrder += 1;
      const childSlug = toSlug(childName);
      const child = await Category.findOneAndUpdate(
        { slug: childSlug },
        {
          name: childName,
          slug: childSlug,
          parent: parent._id,
          order: childOrder,
          isActive: true,
          image: generateCategoryImage(childName, CATEGORY_EMOJI[childName] ?? '🪴'),
        },
        { upsert: true, new: true }
      );
      subcategoryBySlug.set(childSlug, child._id as mongoose.Types.ObjectId);
    }
  }

  // Featured top-level entries used by the header "Featured" menu are handled client-side via flags.
  return subcategoryBySlug;
}

async function seedProducts(subcategoryBySlug: Map<string, mongoose.Types.ObjectId>) {
  const createdProducts: mongoose.Types.ObjectId[] = [];
  const usedSkus = new Set<string>();

  for (let seedIndex = 0; seedIndex < PRODUCT_SEEDS.length; seedIndex += 1) {
    const seed = PRODUCT_SEEDS[seedIndex];
    const slug = toSlug(seed.name);
    const subSlug = toSlug(seed.subcategory);
    const subcategory = subcategoryBySlug.get(subSlug);
    if (!subcategory) continue;

    const subcategoryDoc = await Category.findById(subcategory);
    const category = subcategoryDoc?.parent ?? subcategory;

    let sku = `GL-${slug.toUpperCase().replace(/-/g, '').slice(0, 10)}`;
    if (usedSkus.has(sku)) sku = `${sku}-${seedIndex}`;
    usedSkus.add(sku);

    const emoji = getProductEmoji(seed.name, seed.subcategory);
    const images = [
      generateProductImage(seed.name, emoji, 0),
      generateProductImage(seed.name, emoji, 1),
      generateProductImage(seed.name, emoji, 2),
    ];

    const variants = (seed.variants ?? []).map((v, idx) => ({
      sku: `${sku}-V${idx + 1}`,
      attributes: v.attributes,
      mrp: v.mrp,
      salePrice: v.salePrice,
      stock: v.stock,
      images: [generateProductImage(`${seed.name} (${Object.values(v.attributes).join(', ')})`, emoji, idx)],
    }));

    const product = await Product.findOneAndUpdate(
      { slug },
      {
        name: seed.name,
        slug,
        shortDescription: `${seed.name} — a premium gardening essential for healthier, happier plants.`,
        description: `${seed.name} is carefully selected for Indian gardening conditions. Ideal for both home gardens and balcony gardening, this product helps you grow a thriving, sustainable garden all year round.`,
        howToUse: 'Follow the recommended dosage/usage instructions on the packaging. For best results, use consistently as part of your regular gardening routine.',
        sku,
        brand: 'GreenKart',
        category,
        subcategory,
        images,
        variants,
        mrp: seed.mrp,
        salePrice: seed.salePrice,
        stock: seed.stock,
        tags: seed.tags,
        featured: Boolean(seed.featured),
        bestSeller: Boolean(seed.bestSeller),
        newArrival: Boolean(seed.newArrival),
        seoTitle: seed.name,
        seoDescription: `Buy ${seed.name} online at the best price. Fast delivery across India.`,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    createdProducts.push(product._id as mongoose.Types.ObjectId);
  }

  return createdProducts;
}

async function seedReviews(productIds: mongoose.Types.ObjectId[], customerId: mongoose.Types.ObjectId, adminId: mongoose.Types.ObjectId) {
  const reviewers = [customerId, adminId];
  let created = 0;
  let index = 0;

  for (const productId of productIds) {
    if (created >= 24) break;
    const reviewCount = index % 3 === 0 ? 2 : 1;

    for (let i = 0; i < reviewCount && created < 24; i += 1) {
      const reviewer = reviewers[created % reviewers.length];
      const sample = SAMPLE_REVIEW_TEXT[created % SAMPLE_REVIEW_TEXT.length];
      const rating = 4 + (created % 2);

      await Review.findOneAndUpdate(
        { product: productId, user: reviewer },
        {
          product: productId,
          user: reviewer,
          rating,
          title: sample.title,
          description: sample.description,
          verifiedPurchase: created % 2 === 0,
          isApproved: true,
        },
        { upsert: true }
      );
      created += 1;
    }
    index += 1;
  }

  // Recalculate ratings
  for (const productId of productIds) {
    const stats = await Review.aggregate([
      { $match: { product: productId, isApproved: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avgRating = 0, count = 0 } = stats[0] ?? {};
    await Product.findByIdAndUpdate(productId, { averageRating: avgRating, reviewCount: count });
  }
}

async function seedCoupons() {
  const coupons = [
    { code: 'WELCOME10', type: 'PERCENTAGE' as const, value: 10, minOrderValue: 499, maxDiscount: 300, usageLimit: 1000 },
    { code: 'GARDEN15', type: 'PERCENTAGE' as const, value: 15, minOrderValue: 999, maxDiscount: 500, usageLimit: 500 },
    { code: 'FREEDELIVERY', type: 'FREE_SHIPPING' as const, value: 0, minOrderValue: 399, maxDiscount: null, usageLimit: null },
  ];

  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      { ...coupon, expiresAt: null, usedCount: 0, isActive: true },
      { upsert: true }
    );
  }
}

async function seedBlogPosts(authorId: mongoose.Types.ObjectId) {
  for (const post of BLOG_SEEDS) {
    const slug = toSlug(post.title);
    await BlogPost.findOneAndUpdate(
      { slug },
      {
        title: post.title,
        slug,
        category: post.category,
        excerpt: post.excerpt,
        content: `${post.excerpt}\n\nGardening is a rewarding journey that connects us with nature. In this article, we cover practical, actionable tips you can apply right away, whether you are a complete beginner or a seasoned green thumb. Consistency, the right tools, and quality inputs make all the difference in the long run.`,
        coverImage: generateBannerImage(post.title, BLOG_CATEGORY_EMOJI[post.category] ?? '🌱', 1200, 630),
        author: authorId,
        isPublished: true,
        publishedAt: new Date(),
      },
      { upsert: true }
    );
  }
}

async function run() {
  await connectDatabase();
  console.log('[seed] Connected. Seeding database...');

  const admin = await seedAdmin();
  const customer = await seedDemoCustomer();
  console.log('[seed] Admin & demo customer ready');

  const subcategoryMap = await seedCategories();
  console.log(`[seed] Seeded ${Object.keys(CATEGORY_TREE).length} categories and ${subcategoryMap.size} subcategories`);

  const productIds = await seedProducts(subcategoryMap);
  console.log(`[seed] Seeded ${productIds.length} products`);

  await seedReviews(productIds, customer._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
  console.log('[seed] Seeded reviews');

  await seedCoupons();
  console.log('[seed] Seeded coupons');

  await seedBlogPosts(admin._id as mongoose.Types.ObjectId);
  console.log('[seed] Seeded blog posts');

  await SiteSettings.findOneAndUpdate({ key: 'default' }, { key: 'default' }, { upsert: true });
  await NewsletterSubscriber.findOneAndUpdate(
    { email: 'newsletter-demo@greenkart.example' },
    { email: 'newsletter-demo@greenkart.example', isActive: true },
    { upsert: true }
  );

  console.log('[seed] Done. Demo admin login: admin@greenkart.example / Admin@12345');
  console.log('[seed] Demo customer login: customer@greenkart.example / Customer@12345');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exit(1);
});
