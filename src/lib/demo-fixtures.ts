import type { Menu } from '@/contract';
export const SAMPLE_RESTAURANT = { name: 'The Green Table', slug: 'the-green-table', address: 'Fresh favourites, made for good company.', taxPercent: 5, upiId: null };
export const SAMPLE_MENU: Menu = {
  categories: [{ id: 'bowls', name: 'Bowls & mains', sortOrder: 0 }, { id: 'sides', name: 'Sides', sortOrder: 1 }, { id: 'drinks', name: 'Drinks', sortOrder: 2 }],
  items: [
    { id: 'paneer', categoryId: 'bowls', name: 'Paneer tikka bowl', description: 'Smoky paneer, fragrant rice, fresh greens and mint chutney.', pricePaise: 24000, isVeg: true, isAvailable: true, imageUrl: '/images/menu/paneer.jpg' },
    { id: 'garden', categoryId: 'bowls', name: 'Garden goodness bowl', description: 'Seasonal greens, grains and a bright lemon dressing.', pricePaise: 22000, isVeg: true, isAvailable: true, imageUrl: '/images/menu-bowl.jpg' },
    { id: 'chicken', categoryId: 'bowls', name: 'Butter chicken', description: 'Tender chicken in a creamy tomato gravy.', pricePaise: 32000, isVeg: false, isAvailable: true, imageUrl: '/images/menu/curry.jpg' },
    { id: 'special', categoryId: 'bowls', name: 'Chef’s special', description: 'A little surprise from our kitchen. Back soon.', pricePaise: 28000, isVeg: true, isAvailable: false, imageUrl: null },
    { id: 'naan', categoryId: 'sides', name: 'Garlic naan', description: 'Fresh from the tandoor with garlic butter.', pricePaise: 6000, isVeg: true, isAvailable: true, imageUrl: null },
    { id: 'coffee', categoryId: 'drinks', name: 'Classic cold coffee', description: 'Rich coffee, chilled milk and a little indulgence.', pricePaise: 12000, isVeg: true, isAvailable: true, imageUrl: '/images/menu/coffee.jpg' },
    { id: 'tea', categoryId: 'drinks', name: 'Lemon iced tea', description: 'Freshly brewed tea with a citrus twist.', pricePaise: 9000, isVeg: true, isAvailable: true, imageUrl: '/images/menu/tea.jpg' },
  ],
};
