-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT 'Sonu',
    "lastName" TEXT NOT NULL DEFAULT 'Ambre',
    "whatsapp" TEXT NOT NULL DEFAULT '+91 98765 43210',
    "notifEmailInquiry" BOOLEAN NOT NULL DEFAULT true,
    "notifWhatsappBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifSmsReminder" BOOLEAN NOT NULL DEFAULT false,
    "notifWeeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "integrationCalendarConnected" BOOLEAN NOT NULL DEFAULT true,
    "integrationRazorpayConnected" BOOLEAN NOT NULL DEFAULT true,
    "integrationInstagramConnected" BOOLEAN NOT NULL DEFAULT false,
    "integrationMailchimpConnected" BOOLEAN NOT NULL DEFAULT false,
    "razorpayKeyId" TEXT,
    "razorpayKeySecret" TEXT,
    "privacyPolicy" TEXT,
    "termsOfService" TEXT,
    "refundPolicy" TEXT,
    "gstNumber" TEXT,
    "serviceArea" TEXT DEFAULT 'Personal Training available in Mumbai',
    "seasonalBannerActive" BOOLEAN NOT NULL DEFAULT false,
    "seasonalBannerText" TEXT,
    "seasonalBannerDiscount" INTEGER,
    "heroTitleEn" TEXT DEFAULT 'APEX Fitness Coaching',
    "heroTitleHi" TEXT DEFAULT 'एपेक्स फिटनेस कोचिंग',
    "heroSubtitleEn" TEXT DEFAULT 'Transform your body, build your mind.',
    "heroSubtitleHi" TEXT DEFAULT 'अपने शरीर को बदलें, अपने दिमाग को मजबूत करें।',
    "aboutTextEn" TEXT DEFAULT 'Sonu Ambre is a certified trainer with over 8 years of coaching experience.',
    "aboutTextHi" TEXT DEFAULT 'सोनू आम्ब्रे एक प्रमाणित ट्रेनर हैं जिनके पास 8 साल से अधिक का कोचिंग अनुभव है।',
    "prog1NameEn" TEXT DEFAULT 'Fat Loss',
    "prog1NameHi" TEXT DEFAULT 'वसा हानि',
    "prog1DescEn" TEXT DEFAULT 'Sustainable fat loss coaching.',
    "prog1DescHi" TEXT DEFAULT 'सतत वसा हानि कोचिंग।',
    "prog1PriceEn" TEXT DEFAULT '₹12,000',
    "prog1PriceHi" TEXT DEFAULT '₹12,000',
    "prog2NameEn" TEXT DEFAULT 'Muscle Building',
    "prog2NameHi" TEXT DEFAULT 'मांसपेशियों का निर्माण',
    "prog2DescEn" TEXT DEFAULT 'Hypertrophy and strength training.',
    "prog2DescHi" TEXT DEFAULT 'हाइपरट्रॉफी और ताकत प्रशिक्षण।',
    "prog2PriceEn" TEXT DEFAULT '₹14,000',
    "prog2PriceHi" TEXT DEFAULT '₹14,000',
    "prog3NameEn" TEXT DEFAULT 'Body Recomp',
    "prog3NameHi" TEXT DEFAULT 'बॉडी रीकॉम्प',
    "prog3DescEn" TEXT DEFAULT 'Lose fat and build muscle simultaneously.',
    "prog3DescHi" TEXT DEFAULT 'वसा कम करें और मांसपेशियों का निर्माण एक साथ करें।',
    "prog3PriceEn" TEXT DEFAULT '₹16,000',
    "prog3PriceHi" TEXT DEFAULT '₹16,000',
    "prog4NameEn" TEXT DEFAULT 'Contest Prep',
    "prog4NameHi" TEXT DEFAULT 'प्रतियोगिता तैयारी',
    "prog4DescEn" TEXT DEFAULT 'Stage-ready physique preparation.',
    "prog4DescHi" TEXT DEFAULT 'स्टेज-तैयार शारीरिक तैयारी।',
    "prog4PriceEn" TEXT DEFAULT '₹18,000',
    "prog4PriceHi" TEXT DEFAULT '₹18,000',

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkinDate" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "paidUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "subject" TEXT,
    "time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "programInterest" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transformation" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "beforeImage" TEXT,
    "afterImage" TEXT,
    "testimonial" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'live',
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'live',
    "views" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'Public',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "isVegFriendly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVegFriendly" BOOLEAN NOT NULL DEFAULT false,
    "nameHindi" TEXT,
    "featuresHindi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "signature" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "planId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
