export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="text-lg font-semibold text-white">Fluidreach</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Reach your customers<br />where they are.
          </h1>
          <p className="text-gray-400 text-lg">
            WhatsApp broadcasts, contact management, and marketing automation.
          </p>
        </div>
        <div className="flex gap-8">
          <div><div className="text-2xl font-bold text-white">98%</div><div className="text-gray-400 text-sm">WhatsApp open rate</div></div>
          <div><div className="text-2xl font-bold text-white">10x</div><div className="text-gray-400 text-sm">faster than email</div></div>
          <div><div className="text-2xl font-bold text-white">Free</div><div className="text-gray-400 text-sm">to get started</div></div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}