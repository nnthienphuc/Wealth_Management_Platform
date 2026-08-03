import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Target,
  BarChart3,
  Globe,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

// Desktop Images
import DashboardImg from "../../../assets/landing/Dashboard.png";
import HoldingImg from "../../../assets/landing/Holding.png";
import AccountImg from "../../../assets/landing/Account.png";
import MarketImg from "../../../assets/landing/Market.png";
import TransactionImg from "../../../assets/landing/Transaction.png";

// Mobile Images
import DashboardMobileImg from "../../../assets/landing/DashboardMobile.png";
import HoldingMobileImg from "../../../assets/landing/HoldingMobile.png";
import AccountMobileImg from "../../../assets/landing/AccountMobile.png";
import MarketMobileImg from "../../../assets/landing/MarketMobile.png";
import TransactionMobileImg from "../../../assets/landing/TransactionMobile.png";

const translations = {
  en: {
    navbar: {
      login: "Login",
      register: "Register",
      dashboard: "Go to Dashboard",
    },

    hero: {
      titleTop: "Comprehensive Wealth",
      titleBottom: "Management Platform",
      description:
        "Monitor your cash, bank, credit, savings, and investments with near real-time updates and advanced analytics.",
    },

    features: {
      title: "🌟 Key Features",
      description: "Everything you need to master your financial journey.",
      items: [
        {
          title: "Intuitive Dashboard",
          description:
            "Instant snapshot of Portfolio Value, Cash Balance, and P&L with clear asset allocation charts.",
        },
        {
          title: "Portfolio Holdings",
          description:
            "Near real-time P&L tracking. Set your Target Prices to plan your next buy and sell moves with confidence.",
        },
        {
          title: "Visual Analysis",
          description:
            "Enhance your trading discipline by attaching chart snapshots directly to your transaction notes.",
        },
        {
          title: "Multi-Source Data",
          description:
            "Market data integration from external providers for portfolio tracking and reference.",
        },
        {
          title: "Mobile-First Design",
          description:
            "Optimized for on-the-go tracking, allowing quick transaction entries directly from your smartphone.",
        },
        {
          title: "Secure & Private",
          description:
            "Your financial data is protected through authenticated access and modern security practices.",
        },
      ],
    },

    gettingStarted: {
      title: "📋 How to get started",
      description: "3 simple steps to take control of your assets.",
      steps: [
        {
          title: "Account Setup",
          description:
            "Create accounts that mirror your real-world assets, such as brokerage accounts, crypto wallets, cash, bank accounts, credit cards, and savings. Categorize them correctly for accurate performance tracking.",
        },
        {
          title: "Trading & Analytics",
          buyLabel: "BUY:",
          buyDescription:
            "Funds are automatically deducted from Available Cash and updated into Invested Balance.",
          targetLabel: "Target:",
          targetDescription:
            "Use Holdings to set target prices and upload technical charts in Notes.",
        },
        {
          title: "Import Existing Holdings",
          items: [
            "Input your current invested capital into the relevant account.",
            'Record a "BUY" transaction with your actual quantity and cost price.',
            "Set the FEE Rate to 0% to preserve your original cost basis.",
          ],
        },
      ],
    },

    desktop: {
      title: "💻 Desktop Experience",
      items: {
        account: "Account Management",
        holdings: "Portfolio Holdings",
        market: "Market Tickers",
        transactions: "Transaction History",
      },
    },

    mobile: {
      title: "📱 Mobile Experience",
      description: "Fully optimized for on-the-go portfolio tracking.",
    },

    appInfo: {
      title: "ℹ️ Application Information",
      description: "Data sources, legal information, and developer contact.",

      sourcesTitle: "Market Data Sources",
      stockTitle: "Vietnamese stocks",
      stockSource: "Market prices are sourced from VPS Securities.",
      cryptoTitle: "Cryptocurrency",
      cryptoSource:
        "Market prices are sourced from Binance public market data.",
      refreshNote:
        "Prices are refreshed approximately every two minutes when the upstream data services are available.",

      disclaimerTitle: "Disclaimer & Contact",
      disclaimer1:
        "Market information may be delayed, unavailable, incomplete, or inaccurate. This platform is provided solely for users to track their personal portfolios and access information for reference. The displayed content does not constitute investment, financial, legal, or tax advice.",

      disclaimer2:
        "This is an independent personal project operated on a non-commercial basis. The platform does not sell, sublicense, or offer market data as a standalone product or service. It does not place or execute trades on behalf of users and does not provide brokerage, investment management, or financial advisory services.",

      disclaimer3:
        "This platform has no affiliation, partnership, sponsorship, endorsement, or official connection with VPS Securities or Binance. References to these organizations are made solely to identify the relevant data sources. Company names and trademarks belong to their respective owners. Any rights in the displayed market data remain with the applicable data providers or rights holders.",

      disclaimer4:
        "Users are solely responsible for their use of the platform and for any decisions made based on the displayed information. The developer is not responsible for losses resulting from the use of, or reliance on, this information.",

      contactTitle: "Developer Contact",
      websiteLabel: "Website:",
      emailLabel: "Email:",
    },

    footer: {
      copyright: "© 2026 Nguyễn Ngọc Thiên Phúc. All rights reserved.",
      sources: "Market data: VPS Securities and Binance public market data.",
      disclaimer:
        "Delayed data. For informational purposes only. Not investment advice.",
      appInfoLink: "Data sources, disclaimer & contact",
    },
  },

  vi: {
    navbar: {
      login: "Đăng nhập",
      register: "Đăng ký",
      dashboard: "Vào Dashboard",
    },

    hero: {
      titleTop: "Nền tảng Quản lý",
      titleBottom: "Tài sản Toàn diện",
      description:
        "Theo dõi tiền mặt, ngân hàng, tín dụng, tiết kiệm và danh mục đầu tư với dữ liệu cập nhật gần thời gian thực cùng các công cụ phân tích trực quan.",
    },

    features: {
      title: "🌟 Tính năng nổi bật",
      description:
        "Những công cụ cần thiết để quản lý hành trình tài chính của bạn.",
      items: [
        {
          title: "Dashboard trực quan",
          description:
            "Theo dõi nhanh tổng giá trị danh mục, số dư tiền mặt và hiệu suất P&L với các biểu đồ phân bổ tài sản rõ ràng.",
        },
        {
          title: "Quản lý danh mục đầu tư",
          description:
            "Theo dõi P&L gần thời gian thực và thiết lập giá mục tiêu để chủ động kế hoạch mua hoặc bán.",
        },
        {
          title: "Công cụ phân tích",
          description:
            "Đính kèm ảnh biểu đồ vào ghi chú giao dịch để lưu lại lý do đầu tư và duy trì kỷ luật.",
        },
        {
          title: "Dữ liệu từ nhiều nguồn",
          description:
            "Tích hợp dữ liệu thị trường từ các nguồn bên ngoài nhằm phục vụ theo dõi danh mục và tham khảo.",
        },
        {
          title: "Thiết kế ưu tiên di động",
          description:
            "Tối ưu cho việc theo dõi tài sản mọi lúc, đồng thời hỗ trợ nhập giao dịch nhanh trên điện thoại.",
        },
        {
          title: "Bảo mật và riêng tư",
          description:
            "Dữ liệu tài chính của người dùng được bảo vệ bằng cơ chế xác thực và các biện pháp bảo mật hiện đại.",
        },
      ],
    },

    gettingStarted: {
      title: "📋 Hướng dẫn sử dụng",
      description: "3 bước đơn giản để bắt đầu quản lý tài sản.",
      steps: [
        {
          title: "Thiết lập tài khoản",
          description:
            "Tạo các tài khoản tương ứng với tài sản thực tế như tài khoản chứng khoán, ví tiền điện tử, tiền mặt, ngân hàng, thẻ tín dụng và tiết kiệm. Phân loại chính xác để hệ thống tính toán đúng.",
        },
        {
          title: "Giao dịch và phân tích",
          buyLabel: "MUA:",
          buyDescription:
            "Tiền được tự động trừ khỏi số dư khả dụng và chuyển sang giá trị đã đầu tư.",
          targetLabel: "Mục tiêu:",
          targetDescription:
            "Sử dụng Holdings để thiết lập giá mục tiêu và tải ảnh phân tích kỹ thuật vào phần ghi chú.",
        },
        {
          title: "Nhập danh mục hiện có",
          items: [
            "Nhập số vốn hiện đang đầu tư vào tài khoản tương ứng.",
            'Tạo một giao dịch "BUY" với số lượng và giá vốn thực tế.',
            "Đặt tỷ lệ phí bằng 0% để giữ nguyên giá vốn ban đầu.",
          ],
        },
      ],
    },

    desktop: {
      title: "💻 Trải nghiệm trên máy tính",
      items: {
        account: "Quản lý tài khoản",
        holdings: "Danh mục đầu tư",
        market: "Giá thị trường",
        transactions: "Lịch sử giao dịch",
      },
    },

    mobile: {
      title: "📱 Trải nghiệm trên di động",
      description:
        "Được tối ưu hoàn toàn để theo dõi danh mục mọi lúc, mọi nơi.",
    },

    appInfo: {
      title: "ℹ️ Thông tin ứng dụng",
      description:
        "Nguồn dữ liệu, thông tin pháp lý và liên hệ nhà phát triển.",

      sourcesTitle: "Nguồn dữ liệu thị trường",
      stockTitle: "Chứng khoán Việt Nam",
      stockSource: "Giá thị trường được lấy từ VPS Securities.",
      cryptoTitle: "Tiền điện tử",
      cryptoSource:
        "Giá thị trường được lấy từ dữ liệu thị trường công khai của Binance.",
      refreshNote:
        "Giá được cập nhật khoảng hai phút một lần khi các dịch vụ cung cấp dữ liệu bên ngoài hoạt động bình thường.",

      disclaimerTitle: "Miễn trừ trách nhiệm và Liên hệ",
      disclaimer1:
        "Thông tin thị trường có thể bị chậm, gián đoạn, thiếu hoặc không chính xác. Nền tảng này chỉ được cung cấp để người dùng tự theo dõi danh mục tài sản cá nhân và tham khảo thông tin. Nội dung hiển thị không phải là tư vấn đầu tư, tài chính, pháp lý hoặc thuế.",

      disclaimer2:
        "Đây là một dự án cá nhân độc lập và không nhằm mục đích thương mại. Nền tảng không bán, cấp phép lại hoặc cung cấp dữ liệu thị trường như một sản phẩm hay dịch vụ độc lập. Nền tảng không đặt lệnh hoặc thực hiện giao dịch thay cho người dùng, đồng thời không cung cấp dịch vụ môi giới, quản lý đầu tư hoặc tư vấn tài chính.",

      disclaimer3:
        "Nền tảng này không có bất kỳ mối quan hệ liên kết, hợp tác, tài trợ, bảo chứng hoặc kết nối chính thức nào với VPS Securities hoặc Binance. Việc đề cập đến các đơn vị này chỉ nhằm xác định nguồn dữ liệu. Tên doanh nghiệp và nhãn hiệu thuộc quyền sở hữu của các chủ sở hữu tương ứng. Các quyền đối với dữ liệu thị trường được hiển thị, nếu có, thuộc về nhà cung cấp dữ liệu hoặc chủ thể quyền liên quan.",

      disclaimer4:
        "Người dùng tự chịu trách nhiệm về việc sử dụng nền tảng và mọi quyết định được đưa ra dựa trên thông tin hiển thị. Nhà phát triển không chịu trách nhiệm đối với tổn thất phát sinh từ việc sử dụng hoặc dựa vào các thông tin này.",

      contactTitle: "Liên hệ nhà phát triển",
      websiteLabel: "Website:",
      emailLabel: "Email:",
    },

    footer: {
      copyright: "© 2026 Nguyễn Ngọc Thiên Phúc. Mọi quyền được bảo lưu.",
      sources:
        "Nguồn dữ liệu thị trường: VPS Securities và dữ liệu thị trường công khai của Binance.",
      disclaimer:
        "Dữ liệu có độ trễ, chỉ mang tính chất tham khảo và không phải lời khuyên đầu tư.",
      appInfoLink: "Nguồn dữ liệu, miễn trừ trách nhiệm và liên hệ",
    },
  },
};

const featureIcons = [
  LayoutDashboard,
  Target,
  BarChart3,
  Globe,
  Smartphone,
  ShieldCheck,
];

const OptimizedImage = ({ src, alt, className }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    className={className}
  />
);

export default function LandingPage() {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("landing_language");

    if (savedLanguage === "vi" || savedLanguage === "en") {
      return savedLanguage;
    }

    return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
  });

  const isLoggedIn = !!localStorage.getItem("token");
  const text = translations[language];

  useEffect(() => {
    localStorage.setItem("landing_language", language);
    document.documentElement.lang = language;

    return () => {
      document.documentElement.lang = "en";
    };
  }, [language]);

  useEffect(() => {
    let timerId;

    const scrollToHash = () => {
      clearTimeout(timerId);

      if (!window.location.hash) return;

      timerId = setTimeout(() => {
        const target = document.querySelector(window.location.hash);

        target?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  const desktopItems = [
    {
      img: AccountImg,
      title: text.desktop.items.account,
    },
    {
      img: HoldingImg,
      title: text.desktop.items.holdings,
    },
    {
      img: MarketImg,
      title: text.desktop.items.market,
    },
    {
      img: TransactionImg,
      title: text.desktop.items.transactions,
    },
  ];

  const mobileImages = [
    DashboardMobileImg,
    AccountMobileImg,
    HoldingMobileImg,
    MarketMobileImg,
    TransactionMobileImg,
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f172a] pt-[76px] font-sans text-slate-300 selection:bg-pink-500/30">
      {/* NAVBAR */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-[76px] items-center justify-between border-b border-white/5 bg-[#0f172a]/90 px-4 backdrop-blur-xl sm:px-6 md:px-8">
        <h1 className="whitespace-nowrap text-lg font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 md:text-2xl">
          <span className="hidden sm:inline">Wealth Management Platform</span>
          <span className="sm:hidden">WMP</span>
        </h1>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* LANGUAGE SWITCH */}
          <div className="flex items-center rounded-full border border-slate-700 bg-slate-900/70 p-1 text-xs font-bold">
            <button
              type="button"
              aria-pressed={language === "vi"}
              onClick={() => setLanguage("vi")}
              className={`rounded-full px-2 py-1.5 transition-all sm:px-3 ${
                language === "vi"
                  ? "bg-pink-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              VI
            </button>

            <button
              type="button"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
              className={`rounded-full px-2 py-1.5 transition-all sm:px-3 ${
                language === "en"
                  ? "bg-pink-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {isLoggedIn ? (
            <a
              href="/investor"
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:from-pink-600 hover:to-rose-600 sm:px-4 md:px-6 md:text-sm"
            >
              {text.navbar.dashboard}
            </a>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
              <a
                href="/login"
                className="
      whitespace-nowrap rounded-full
      px-2 py-2
      text-xs font-semibold text-slate-300
      transition hover:bg-white/5 hover:text-white
      sm:px-3 md:text-sm
    "
              >
                {text.navbar.login}
              </a>

              <a
                href="/register"
                className="
      whitespace-nowrap rounded-full
      bg-gradient-to-r from-pink-500 to-rose-500
      px-3 py-2
      text-xs font-bold text-white
      shadow-[0_0_20px_rgba(236,72,153,0.3)]
      transition-all hover:scale-105
      sm:px-4 md:px-6 md:text-sm
    "
              >
                {text.navbar.register}
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative px-6 pb-16 pt-20 text-center md:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/20 blur-[120px]" />

        <h2 className="relative mb-6 text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
          {text.hero.titleTop}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
            {text.hero.titleBottom}
          </span>
        </h2>

        <p className="relative mx-auto mb-12 max-w-3xl text-base text-slate-300 md:text-xl">
          {text.hero.description}
        </p>

        <div className="relative mx-auto mt-12 max-w-5xl rounded-2xl border border-slate-700/50 bg-slate-800/50 p-2 shadow-2xl backdrop-blur-sm">
          <img
            src={DashboardImg}
            alt="Dashboard Preview"
            fetchPriority="high"
            decoding="async"
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900"
          />
        </div>
      </header>

      <main className="container mx-auto space-y-32 px-6 py-16">
        {/* KEY FEATURES */}
        <section>
          <div className="mb-16 text-center">
            <h3 className="mb-3 text-3xl font-black text-white">
              {text.features.title}
            </h3>

            <p className="text-slate-500">{text.features.description}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {text.features.items.map((feature, index) => {
              const FeatureIcon = featureIcons[index];

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 transition-colors hover:border-pink-500/50"
                >
                  <FeatureIcon className="mb-4 h-10 w-10 text-pink-400 transition-transform group-hover:scale-110" />

                  <h4 className="mb-2 text-lg font-bold text-white">
                    {feature.title}
                  </h4>

                  <p className="text-sm leading-relaxed text-slate-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW TO GET STARTED */}
        <section>
          <div className="mb-16 text-center">
            <h3 className="mb-3 text-3xl font-black text-white">
              {text.gettingStarted.title}
            </h3>

            <p className="text-slate-500">{text.gettingStarted.description}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* STEP 1 */}
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8">
              <div className="absolute -left-5 -top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-pink-500 bg-slate-800 text-xl font-black text-pink-500 shadow-lg">
                1
              </div>

              <h4 className="mb-3 text-xl font-bold text-white">
                {text.gettingStarted.steps[0].title}
              </h4>

              <p className="text-sm leading-relaxed text-slate-300">
                {text.gettingStarted.steps[0].description}
              </p>
            </div>

            {/* STEP 2 */}
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8">
              <div className="absolute -left-5 -top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-pink-500 bg-slate-800 text-xl font-black text-pink-500 shadow-lg">
                2
              </div>

              <h4 className="mb-3 text-xl font-bold text-white">
                {text.gettingStarted.steps[1].title}
              </h4>

              <ul className="space-y-3">
                <li className="text-sm leading-relaxed text-slate-300">
                  <span className="font-bold text-pink-400">
                    {text.gettingStarted.steps[1].buyLabel}
                  </span>{" "}
                  {text.gettingStarted.steps[1].buyDescription}
                </li>

                <li className="text-sm leading-relaxed text-slate-300">
                  <span className="font-bold text-pink-400">
                    {text.gettingStarted.steps[1].targetLabel}
                  </span>{" "}
                  {text.gettingStarted.steps[1].targetDescription}
                </li>
              </ul>
            </div>

            {/* STEP 3 */}
            <div className="relative rounded-2xl border border-pink-500/30 bg-slate-800/30 p-8 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
              <div className="absolute -left-5 -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-xl font-black text-white shadow-lg shadow-pink-500/40">
                3
              </div>

              <h4 className="mb-4 text-xl font-bold text-white">
                {text.gettingStarted.steps[2].title}
              </h4>

              <ul className="space-y-4">
                {text.gettingStarted.steps[2].items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pink-400" />

                    <p className="text-sm leading-relaxed text-slate-200">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* DESKTOP PRODUCT TOUR */}
        <section>
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-black text-white">
              {text.desktop.title}
            </h3>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {desktopItems.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800"
              >
                <div className="absolute left-0 top-0 z-10 w-full border-b border-slate-700/50 bg-slate-900/80 px-4 py-2 text-sm font-bold text-pink-400 backdrop-blur">
                  {item.title}
                </div>

                <OptimizedImage
                  src={item.img}
                  alt={item.title}
                  className="mt-8 w-full bg-slate-900 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        {/* MOBILE PRODUCT TOUR */}
        <section>
          <div className="mb-12 mt-20 text-center">
            <h3 className="mb-3 text-3xl font-black text-white">
              {text.mobile.title}
            </h3>

            <p className="text-slate-500">{text.mobile.description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {mobileImages.map((img, index) => (
              <div key={index} className="group relative">
                <div className="custom-scrollbar h-[350px] w-[160px] overflow-y-auto overflow-x-hidden rounded-[2rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-500 group-hover:-translate-y-3 md:h-[450px] md:w-[220px]">
                  <OptimizedImage
                    src={img}
                    alt={`${text.mobile.title} ${index + 1}`}
                    className="h-auto w-full bg-slate-900 object-top"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* APP INFO */}
        <section id="app-info" className="mx-auto max-w-5xl scroll-mt-28">
          <div className="mb-12 text-center">
            <h3 className="mb-3 text-3xl font-black text-white">
              {text.appInfo.title}
            </h3>

            <p className="text-slate-500">{text.appInfo.description}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* DATA SOURCES */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-7">
              <Globe className="mb-4 h-9 w-9 text-pink-400" />

              <h4 className="mb-4 text-lg font-bold text-white">
                {text.appInfo.sourcesTitle}
              </h4>

              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <p className="font-bold text-slate-200">
                    {text.appInfo.stockTitle}
                  </p>

                  <p className="text-slate-400">{text.appInfo.stockSource}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-200">
                    {text.appInfo.cryptoTitle}
                  </p>

                  <p className="text-slate-400">{text.appInfo.cryptoSource}</p>
                </div>

                <p className="border-t border-slate-700/50 pt-4 text-xs italic leading-relaxed text-slate-500">
                  {text.appInfo.refreshNote}
                </p>
              </div>
            </div>

            {/* DISCLAIMER & CONTACT */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-7">
              <ShieldCheck className="mb-4 h-9 w-9 text-pink-400" />

              <h4 className="mb-4 text-lg font-bold text-white">
                {text.appInfo.disclaimerTitle}
              </h4>

              <div className="space-y-4 text-sm leading-relaxed text-slate-400">
                <p>{text.appInfo.disclaimer1}</p>
                <p>{text.appInfo.disclaimer2}</p>
                <p>{text.appInfo.disclaimer3}</p>
                <p>{text.appInfo.disclaimer4}</p>

                <div className="border-t border-slate-700/50 pt-4">
                  <p className="mb-2 font-bold text-slate-200">
                    {text.appInfo.contactTitle}
                  </p>

                  <div className="space-y-1">
                    <p className="text-slate-300">Nguyễn Ngọc Thiên Phúc</p>

                    <p>
                      {text.appInfo.websiteLabel}{" "}
                      <a
                        href="https://nnthienphuc.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 transition-colors hover:text-pink-300"
                      >
                        nnthienphuc.me
                      </a>
                    </p>

                    <p>
                      {text.appInfo.emailLabel}{" "}
                      <a
                        href="mailto:nnthienphuc@gmail.com"
                        className="text-pink-400 transition-colors hover:text-pink-300"
                      >
                        nnthienphuc@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-white/5 bg-slate-900/50 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-2 text-sm text-slate-400">{text.footer.copyright}</p>

          <p className="text-xs leading-relaxed text-slate-600">
            {text.footer.sources}
            <br />
            {text.footer.disclaimer}
          </p>

          <a
            href="#app-info"
            className="mt-3 inline-block text-xs font-semibold text-pink-400 hover:text-pink-300"
          >
            {text.footer.appInfoLink}
          </a>
        </div>
      </footer>
    </div>
  );
}
