const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding/Updating database (Non-destructive)...');

  // 1. Admin seeding/updating (Consolidated single update path by primary key ID only)
  const existingAdmin = await prisma.admin.findFirst();
  const passwordHash = await bcrypt.hash('Sonu@2026', 10);

  if (existingAdmin) {
    console.log(`Found existing admin with ID: ${existingAdmin.id}. Updating names and email in place...`);
    await prisma.admin.update({
      where: { id: existingAdmin.id },
      data: {
        email: 'sonuambre0@gmail.com',
        firstName: 'Sonu',
        lastName: 'Ambre',
        whatsapp: '+91 98765 43210',
        serviceArea: 'Personal Training available in Mumbai • Online Coaching Across India',
        seasonalBannerText: 'Wedding Season Special: Get ₹1,500 off on all coaching plans!',
        aboutTextEn: 'Sonu Ambre is a certified trainer with over 8 years of coaching experience. His structured online methods have helped hundreds of clients achieve sustainable fat loss, clean muscle building, and peak physique transformations.',
        aboutTextHi: 'सोनू आम्ब्रे एक प्रमाणित ट्रेनर हैं जिनके पास 8 साल से अधिक का कोचिंग अनुभव है। उनकी संरचित ऑनलाइन विधियों ने सैकड़ों ग्राहकों को निरंतर वसा हानि, मांसपेशियों के निर्माण और चरम शारीरिक परिवर्तन प्राप्त करने में मदद की है।'
      }
    });
  } else {
    console.log('No admin record found. Creating a brand new Admin record...');
    await prisma.admin.create({
      data: {
        email: 'sonuambre0@gmail.com',
        passwordHash,
        firstName: 'Sonu',
        lastName: 'Ambre',
        whatsapp: '+91 98765 43210',
        notifEmailInquiry: true,
        notifWhatsappBooking: true,
        notifSmsReminder: false,
        notifWeeklySummary: true,
        integrationCalendarConnected: true,
        integrationRazorpayConnected: true,
        integrationInstagramConnected: false,
        integrationMailchimpConnected: false,
        razorpayKeyId: 'rzp_test_placeholderKey123',
        razorpayKeySecret: 'placeholderSecret123',
        privacyPolicy: `<h3>1. Data Collection</h3><p>We collect names, emails, and phone numbers when you submit a contact or booking request. This data is stored securely in our SQLite database and is never shared.</p><h3>2. Communications</h3><p>By submitting your phone number, you consent to receive direct check-in updates and schedule links on WhatsApp.</p>`,
        termsOfService: `<h3>1. Coaching Enrollment</h3><p>Enrollment in APEX online programs constitutes agreement to our training regulations. Consult a physician before undertaking high-intensity physical tasks.</p><h3>2. Intellectual Property</h3><p>All delivered PDF templates, workout plans, and nutrition frameworks are for your personal use only.</p>`,
        refundPolicy: `<h3>1. 7-Day Money-Back Window</h3><p>If you are not satisfied with the onboarding process or initial coach assessment, you can request a full refund within 7 days of enrollment.</p><h3>2. Conditions</h3><p>Refunds are void if custom nutrition and training programs have already been delivered or if a client has completed weekly check-ins.</p>`,
        gstNumber: '',
        serviceArea: 'Personal Training available in Mumbai • Online Coaching Across India',
        seasonalBannerActive: false,
        seasonalBannerText: 'Wedding Season Special: Get ₹1,500 off on all coaching plans!',
        seasonalBannerDiscount: 1500,
        heroTitleEn: 'APEX Fitness Coaching',
        heroTitleHi: 'एपेक्स फिटनेस कोचिंग',
        heroSubtitleEn: 'Built from grit, refined by science.',
        heroSubtitleHi: 'साहस से निर्मित, विज्ञान द्वारा परिष्कृत।',
        aboutTextEn: 'Sonu Ambre is a certified trainer with over 8 years of coaching experience. His structured online methods have helped hundreds of clients achieve sustainable fat loss, clean muscle building, and peak physique transformations.',
        aboutTextHi: 'सोनू आम्ब्रे एक प्रमाणित ट्रेनर हैं जिनके पास 8 साल से अधिक का कोचिंग अनुभव है। उनकी संरचित ऑनलाइन विधियों ने सैकड़ों ग्राहकों को निरंतर वसा हानि, मांसपेशियों के निर्माण और चरम शारीरिक परिवर्तन प्राप्त करने में मदद की है।'
      }
    });
  }

  // 2. Clients seeding (skip if not empty)
  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    const clientsData = [
      { name: 'Rohan Patel', program: 'Fat Loss', plan: 'Elite', checkinDate: 'Jan 14', progress: 68, status: 'active', startDate: new Date('2023-12-15') },
      { name: 'Sana Nair', program: "Women's", plan: 'Pro', checkinDate: 'Jan 15', progress: 42, status: 'active', startDate: new Date('2023-12-15') },
      { name: 'Arjun Kumar', program: 'Contest Prep', plan: 'Elite', checkinDate: 'Jan 13', progress: 85, status: 'active', startDate: new Date('2023-12-15') },
      { name: 'Priya Desai', program: 'Muscle Build', plan: 'Pro', checkinDate: 'Jan 14', progress: 55, status: 'active', startDate: new Date('2023-12-15') },
      { name: 'Vikram Khanna', program: 'Body Recomp', plan: 'Basic', checkinDate: 'Jan 12', progress: 30, status: 'active', startDate: new Date('2023-12-15') },
      { name: 'Ananya Mehta', program: 'Fat Loss', plan: 'Pro', checkinDate: 'Jan 10', progress: 78, status: 'active', startDate: new Date('2023-12-15') },
    ];
    for (const c of clientsData) {
      await prisma.client.create({ data: c });
    }
    console.log(`Created ${clientsData.length} clients`);
  } else {
    console.log('Clients table is not empty. Skipping default client seeding.');
  }

  // 3. Inquiries seeding (skip if not empty)
  const inquiryCount = await prisma.inquiry.count();
  if (inquiryCount === 0) {
    const inquiriesData = [
      { name: 'Neha Kapoor', email: 'neha@kapoor.com', message: 'Hi, I want to lose 15kg before my wedding in April. Is the fat loss program right for me?', time: '2 hours ago', status: 'new' },
      { name: 'Raj Verma', email: 'raj@verma.com', message: "I've been lifting for 3 years but hit a plateau. Looking for muscle building coaching.", time: '5 hours ago', status: 'new' },
      { name: 'Kiran Shah', email: 'kiran@shah.com', message: "Interested in women's coaching. Can you share more about what's included?", time: 'Yesterday', status: 'new' },
      { name: 'Manish Singh', email: 'manish@singh.com', message: 'What is the minimum commitment period? Can I try for 1 month first?', time: 'Yesterday', status: 'new' },
    ];
    for (const i of inquiriesData) {
      await prisma.inquiry.create({ data: i });
    }
    console.log(`Created ${inquiriesData.length} inquiries`);
  } else {
    console.log('Inquiries table is not empty. Skipping default inquiry seeding.');
  }

  // 4. Bookings seeding (skip if not empty)
  const bookingCount = await prisma.booking.count();
  if (bookingCount === 0) {
    const bookingsData = [
      { name: 'Rohan Patel', email: 'rohan@email.com', phone: '+91 98765 43210', dateTime: new Date('2026-01-15T10:00:00Z'), programInterest: 'Fat Loss', status: 'pending' },
      { name: 'Sana Nair', email: 'sana@email.com', phone: '+91 98765 43210', dateTime: new Date('2026-01-15T11:30:00Z'), programInterest: "Women's Coaching", status: 'pending' },
      { name: 'Arjun Kumar', email: 'arjun@email.com', phone: '+91 98765 43210', dateTime: new Date('2026-01-16T14:00:00Z'), programInterest: 'Contest Prep', status: 'confirmed' },
      { name: 'Priya Desai', email: 'priya@email.com', phone: '+91 98765 43210', dateTime: new Date('2026-01-17T09:00:00Z'), programInterest: 'Muscle Building', status: 'confirmed' },
      { name: 'Vikram Khanna', email: 'vikram@email.com', phone: '+91 98765 43210', dateTime: new Date('2026-01-18T16:00:00Z'), programInterest: 'Body Recomp', status: 'pending' },
    ];
    for (const b of bookingsData) {
      await prisma.booking.create({ data: b });
    }
    console.log(`Created ${bookingsData.length} bookings`);
  } else {
    console.log('Bookings table is not empty. Skipping default booking seeding.');
  }

  // 5. Blog Posts seeding (skip if not empty)
  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    const blogPostsData = [
      { title: '5 Fat Loss Mistakes', category: 'Fat Loss', content: 'Here are the top 5 mistakes people make when trying to lose body fat:\n1. Not tracking liquid calories.\n2. Underestimating portion sizes.\n3. Skipping resistance training.\n4. Prioritizing cardio over nutrition.\n5. Lack of sleep consistency.', status: 'published' },
      { title: 'Progressive Overload 101', category: 'Training', content: 'Progressive overload is the foundation of muscle growth. You must gradually increase the stress placed on your body during training over time. This can be achieved by: adding weight to the bar, performing more reps, increasing training volume, or improving technique.', status: 'published' },
      { title: 'Protein Sources Ranked', category: 'Nutrition', content: 'Protein is critical for muscle retention and satiety. Here is how standard protein sources rank based on bioavailability and macro profiles:\n1. Whey Isolate / Eggs\n2. Chicken Breast / Lean Fish\n3. Lean Beef / Soy Isolate\n4. Lentils / Paneer / Tofu', status: 'published' },
      { title: 'Sleep & Muscle Recovery', category: 'Mindset', content: 'Sleep is when the magic happens. Without 7-9 hours of high-quality sleep, your protein synthesis is compromised, cortisol levels skyrocket, and training performance drops. Consistency in wake/sleep times is key.', status: 'published' },
    ];
    for (const bp of blogPostsData) {
      await prisma.blogPost.create({ data: bp });
    }
    console.log(`Created ${blogPostsData.length} blog posts`);
  } else {
    console.log('Blog posts table is not empty. Skipping default blog seeding.');
  }

  // 6. Transformations seeding (skip if not empty, otherwise seed with "Sonu" text)
  const transCount = await prisma.transformation.count();
  if (transCount === 0) {
    const transformationsData = [
      { clientName: 'Rohan P.', duration: '20 weeks', result: '−24kg', programType: 'Fat Loss', consent: true, status: 'live', testimonial: 'I tried 3 coaches before Sonu. In 12 weeks with him, I lost more than I had in the previous 2 years combined.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { clientName: 'Sana N.', duration: '24 weeks', result: '+9kg lean muscle', programType: 'Muscle Building', consent: true, status: 'live', testimonial: 'As a complete beginner, I was terrified of the gym. Sonu built my confidence rep by rep.', videoUrl: '' },
      { clientName: 'Arjun K.', duration: '16 weeks', result: 'Stage-ready', programType: 'Contest Prep', consent: true, status: 'live', testimonial: 'Contest prep is brutal. Sonu made it the best experience of my competitive career.', videoUrl: '' },
      { clientName: 'Dev K.', duration: '12 weeks', result: '−18kg', programType: 'Fat Loss', consent: false, status: 'draft', videoUrl: '' },
    ];
    for (const t of transformationsData) {
      await prisma.transformation.create({ data: t });
    }
    console.log(`Created ${transformationsData.length} transformations`);
  } else {
    console.log('Transformations table is not empty. Updating existing instances of Marcus -> Sonu.');
    const existingTrans = await prisma.transformation.findMany();
    for (const t of existingTrans) {
      if (t.testimonial && t.testimonial.includes('Marcus')) {
        await prisma.transformation.update({
          where: { id: t.id },
          data: { testimonial: t.testimonial.replace(/Marcus/g, 'Sonu') }
        });
      }
    }
  }


  // 8. Resources seeding (skip if not empty)
  const resourceCount = await prisma.resource.count();
  if (resourceCount === 0) {
    const resourcesData = [
      { name: 'Fat Loss Blueprint.pdf', type: 'eBook', access: 'Public', downloads: 312, isVegFriendly: true },
      { name: '12-Week Bulk Plan.pdf', type: 'Workout PDF', access: 'Pro+', downloads: 88, isVegFriendly: false },
      { name: 'Elite Meal Plan Dec.pdf', type: 'Meal Plan PDF', access: 'Elite', downloads: 24, isVegFriendly: true },
      { name: 'Weekly Check-in Form', type: 'Check-in Form', access: 'All', downloads: 156, isVegFriendly: true },
    ];
    for (const r of resourcesData) {
      await prisma.resource.create({ data: r });
    }
    console.log(`Created ${resourcesData.length} resources`);
  } else {
    console.log('Resources table is not empty. Skipping resource seeding.');
  }

  // 9. Pricing Plans seeding (skip if not empty)
  const pricingCount = await prisma.pricingPlan.count();
  if (pricingCount === 0) {
    const pricingPlansData = [
      {
        name: 'Basic',
        price: 8999,
        features: 'Custom workout plan\nNutrition framework\nWeekly check-in\nApp access',
        isActive: true,
        isVegFriendly: true,
        nameHindi: 'बेसिक',
        featuresHindi: 'कस्टम वर्कआउट प्लान\nपोषण ढांचा\nसाप्ताहिक चेक-इन\nऐप एक्सेस',
      },
      {
        name: 'Pro',
        price: 14999,
        features: 'Custom workout plan\nCustom macro targets\n2× weekly check-ins\nApp access + logs\nDirect WhatsApp\nVideo form review',
        isActive: true,
        isVegFriendly: false,
        nameHindi: 'प्रो',
        featuresHindi: 'कस्टम वर्कआउट प्लान\nकस्टम मैक्रो लक्ष्य\nसप्ताह में दो बार चेक-इन\nऐप एक्सेस + लॉग्स\nसीधा व्हाट्सएप\nवीडियो फॉर्म समीक्षा',
      },
      {
        name: 'Elite',
        price: 22999,
        features: 'Custom workout plan\nPrecision custom macros\nUnlimited check-ins\nFull app access\nPriority WhatsApp\nForm video reviews\nSupplement guidance',
        isActive: true,
        isVegFriendly: true,
        nameHindi: 'एलीट',
        featuresHindi: 'कस्टम वर्कआउट प्लान\nसटीक कस्टम मैक्रोज़\nअसीमित चेक-इन\nपूर्ण ऐप एक्सेस\nप्राथमिकता व्हाट्सएप\nफॉर्म वीडियो समीक्षा\nपूरक मार्गदर्शन',
      },
    ];
    for (const p of pricingPlansData) {
      await prisma.pricingPlan.create({ data: p });
    }
    console.log(`Created ${pricingPlansData.length} pricing plans`);
  } else {
    console.log('Pricing plans table is not empty. Skipping pricing seeding.');
  }

  // 10. Certifications seeding (skip if not empty)
  const certCount = await prisma.certification.count();
  if (certCount === 0) {
    const certsData = [
      { title: 'NSCA-CPT', issuingBody: 'National Strength and Conditioning Association', imageUrl: '' },
      { title: 'Precision Nutrition L1', issuingBody: 'Precision Nutrition', imageUrl: '' },
      { title: 'ISSA Physique Specialist', issuingBody: 'International Sports Sciences Association', imageUrl: '' },
      { title: 'NASM-CES', issuingBody: 'National Academy of Sports Medicine', imageUrl: '' },
    ];
    for (const cert of certsData) {
      await prisma.certification.create({ data: cert });
    }
    console.log(`Created ${certsData.length} certifications`);
  } else {
    console.log('Certifications table is not empty. Skipping certifications seeding.');
  }

  console.log('Seeding finished successfully (Non-destructive).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
