import React from "react";
import { 
  LayoutDashboard, 
  Target, 
  BarChart3, 
  Globe, 
  Smartphone,
  CheckCircle2,
  ShieldCheck
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

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  // Component giúp Safari không bị "nghẽn" khi cuộn trang
  const OptimizedImage = ({ src, alt, className }) => (
    <img 
      src={src} 
      alt={alt} 
      loading="lazy" 
      decoding="async"
      className={className} 
    />
  );

  return (
    <div className="bg-[#0f172a] text-slate-300 min-h-screen font-sans selection:bg-pink-500/30 overflow-hidden">
      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl z-50">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 italic tracking-tighter">
          Wealth Management Platform
        </h1>
        {isLoggedIn ? (
          <a href="/investor" className="px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            Go to Dashboard
          </a>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/login" className="px-5 py-2 font-semibold text-slate-300 hover:text-white transition">Login</a>
            <a href="/register" className="px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              Register
            </a>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-24 pb-16 px-6 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <h2 className="relative text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          Comprehensive Wealth <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Management Platform</span>
        </h2>
        
        <p className="relative text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12">
          <span className="block mb-2">Monitor your cash, bank, credit, savings, and investments with near real-time updates and advanced analytics.</span>
          <span className="block text-sm italic text-slate-500">Quản lý tài sản cá nhân toàn diện, kiểm soát dòng tiền từ tiền mặt, ngân hàng, tín dụng, tiết kiệm đến chứng khoán và tiền điện tử.</span>
        </p>

        <div className="relative max-w-5xl mx-auto mt-12 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-2 shadow-2xl backdrop-blur-sm">
          {/* ẢNH HERO: KHÔNG dùng lazy load, BẮT BUỘC ưu tiên load cao nhất */}
          <img 
            src={DashboardImg} 
            alt="Dashboard Preview" 
            fetchpriority="high"
            decoding="async"
            className="rounded-xl w-full border border-slate-700/50 bg-slate-900" 
          />
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 space-y-32">
        
        {/* KEY FEATURES */}
        <section>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-white mb-3">🌟 Key Features <span className="text-pink-500">/</span> <span className="text-slate-400 font-medium">Tính năng nổi bật</span></h3>
            <p className="text-slate-500">Everything you need to master your financial journey.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <LayoutDashboard className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Intuitive Dashboard</h4>
              <p className="text-sm text-slate-300 mb-3">Instant snapshot of Portfolio Value, Cash Balance, and P&L with clear asset allocation charts.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Dashboard trực quan</h4>
                <p className="text-xs text-slate-500 italic">Theo dõi nhanh tổng tài sản, số dư tiền mặt cùng hiệu suất P&L với biểu đồ phân bổ chi tiết.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <Target className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Portfolio Holdings</h4>
              <p className="text-sm text-slate-300 mb-3">Real-time P&L tracking. Set your Target Prices to plan your next buy/sell moves with confidence.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Quản lý danh mục</h4>
                <p className="text-xs text-slate-500 italic">Theo dõi P&L thời gian thực. Hỗ trợ thiết lập giá mục tiêu để chủ động kế hoạch giao dịch.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <BarChart3 className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Visual Analysis</h4>
              <p className="text-sm text-slate-300 mb-3">Enhance your trading discipline by attaching chart snapshots directly to your transaction notes.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Công cụ phân tích</h4>
                <p className="text-xs text-slate-500 italic">Đính kèm ảnh chụp biểu đồ vào ghi chú giao dịch để lưu lại lý do đầu tư, duy trì kỷ luật.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <Globe className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Multi-Source Data</h4>
              <p className="text-sm text-slate-300 mb-3">Reliable data integration from trusted market APIs ensuring high accuracy for your portfolio.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Đa nguồn dữ liệu</h4>
                <p className="text-xs text-slate-500 italic">Tích hợp dữ liệu thị trường uy tín, liên tục cập nhật để đảm bảo độ chính xác cao nhất.</p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <Smartphone className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Mobile-First Design</h4>
              <p className="text-sm text-slate-300 mb-3">Optimized for on-the-go tracking, allowing quick transaction entries directly from your smartphone.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Giao diện Responsive</h4>
                <p className="text-xs text-slate-500 italic">Tối ưu hoàn hảo cho cả Desktop và Mobile, giúp bạn cập nhật danh mục mọi lúc mọi nơi.</p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/50 transition-colors group">
              <ShieldCheck className="w-10 h-10 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-bold text-white mb-2">Secure & Private</h4>
              <p className="text-sm text-slate-300 mb-3">Your financial data remains strictly confidential with modern security standards and encryption.</p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <h4 className="text-sm font-bold text-slate-400 mb-1">Bảo mật & Riêng tư</h4>
                <p className="text-xs text-slate-500 italic">Dữ liệu tài chính là của riêng bạn. Hệ thống áp dụng tiêu chuẩn bảo mật hiện đại nhất.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW TO GET STARTED */}
        <section>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-white mb-3">📋 How to get started <span className="text-pink-500">/</span> <span className="text-slate-400 font-medium">Hướng dẫn sử dụng</span></h3>
            <p className="text-slate-500">3 simple steps to take control of your assets.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl">
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-slate-800 border-2 border-pink-500 rounded-full flex items-center justify-center text-xl font-black text-pink-500 shadow-lg">1</div>
              <h4 className="text-xl font-bold text-white mb-3">Account Setup</h4>
              <p className="text-slate-300 text-sm mb-4">Create accounts that mirror your real-world assets (Brokerage, Crypto Wallets, Cash). Categorize correctly for accurate performance tracking.</p>
              <div className="border-t border-slate-700/50 pt-3">
                <h5 className="text-sm font-bold text-slate-400 mb-1">Thiết lập tài khoản</h5>
                <p className="text-slate-500 text-xs italic">Tạo các "Account" tương ứng với ví thực tế (Ví dụ: TCBS, Binance, Tiền mặt). Lưu ý phân loại đúng loại tài khoản.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl">
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-slate-800 border-2 border-pink-500 rounded-full flex items-center justify-center text-xl font-black text-pink-500 shadow-lg">2</div>
              <h4 className="text-xl font-bold text-white mb-3">Trading & Analytics</h4>
              <ul className="space-y-3 mb-4">
                <li className="text-sm text-slate-300">
                  <span className="font-bold text-pink-400">BUY:</span> Funds are automatically deducted from Available Cash and updated into Invested Balance.
                </li>
                <li className="text-sm text-slate-300">
                  <span className="font-bold text-pink-400">Target:</span> Use Holdings to set targets. Upload technical charts in Notes.
                </li>
              </ul>
              <div className="border-t border-slate-700/50 pt-3">
                <h5 className="text-sm font-bold text-slate-400 mb-1">Giao dịch & Mục tiêu</h5>
                <p className="text-slate-500 text-xs italic">Lệnh Mua tự động trừ tiền Cash. Đặt Target và dùng Note lưu ảnh phân tích kỹ thuật.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-800/30 border border-pink-500/30 p-8 rounded-2xl shadow-[0_0_15px_rgba(236,72,153,0.1)]">
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg shadow-pink-500/40">3</div>
              <h4 className="text-xl font-bold text-white mb-4">Import Existing Holdings</h4>
              
              <ul className="space-y-4 mb-5">
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-200">Input your current invested capital into the relevant account.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-200">Record a "BUY" transaction with your actual quantity and cost price.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-200">Set the <span className="font-bold text-pink-400">FEE Rate to 0%</span> to preserve your cost basis.</p>
                  </div>
                </li>
              </ul>
              <div className="border-t border-pink-500/30 pt-3">
                <h5 className="text-sm font-bold text-pink-300 mb-1">Nhập dữ liệu cũ</h5>
                <p className="text-pink-400/70 text-xs italic">1. Nhập vốn vào Account. 2. Tạo giao dịch Mua với giá vốn thực tế. 3. Đặt Phí 0% để giữ nguyên giá vốn ban đầu.</p>
              </div>
            </div>
          </div>
        </section>

        {/* DESKTOP PRODUCT TOUR */}
        <section>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-white mb-3">💻 Desktop Experience</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { img: AccountImg, en: 'Account Management', vi: 'Quản lý Tài khoản' },
              { img: HoldingImg, en: 'Portfolio Holdings', vi: 'Danh mục đầu tư' },
              { img: MarketImg, en: 'Market Tickers', vi: 'Thị trường' },
              { img: TransactionImg, en: 'Transaction History', vi: 'Nhật ký Giao dịch' }
            ].map((item, idx) => (
              <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800">
                <div className="absolute top-0 left-0 w-full bg-slate-900/80 backdrop-blur px-4 py-2 text-sm font-bold border-b border-slate-700/50 text-pink-400 z-10 flex justify-between items-center">
                  <span>{item.en}</span>
                  <span className="text-xs text-slate-400 font-normal">{item.vi}</span>
                </div>
                {/* ĐÃ DÙNG OPTIMIZED IMAGE Ở ĐÂY */}
                <OptimizedImage 
                  src={item.img} 
                  alt={item.en} 
                  className="w-full mt-8 group-hover:scale-105 transition-transform duration-700 bg-slate-900" 
                />
              </div>
            ))}
          </div>
        </section>

        {/* MOBILE PRODUCT TOUR */}
        <section>
          <div className="text-center mb-12 mt-20">
            <h3 className="text-3xl font-black text-white mb-3">📱 Mobile Experience</h3>
            <p className="text-slate-500">Fully optimized for on-the-go portfolio tracking.</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {[DashboardMobileImg, AccountMobileImg, HoldingMobileImg, MarketMobileImg, TransactionMobileImg].map((img, idx) => (
              <div key={idx} className="relative group">
                <div className="w-[160px] md:w-[220px] h-[350px] md:h-[450px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-900 overflow-y-auto overflow-x-hidden shadow-2xl group-hover:-translate-y-3 transition-transform duration-500 custom-scrollbar">
                  {/* ĐÃ DÙNG OPTIMIZED IMAGE Ở ĐÂY */}
                  <OptimizedImage 
                    src={img} 
                    alt="Mobile UI" 
                    className="w-full h-auto object-top bg-slate-900" 
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-slate-900/50 py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm mb-2">© 2026 Nguyễn Ngọc Thiên Phúc. All rights reserved.</p>
          <p className="text-slate-600 text-xs italic">
            ⚠️ Disclaimer: Market data is delayed (approx. 2 mins) and for informational purposes only.
            <br />
            Dữ liệu thị trường có độ trễ khoảng 2 phút và chỉ mang tính chất tham khảo.
          </p>
        </div>
      </footer>
    </div>
  );
}