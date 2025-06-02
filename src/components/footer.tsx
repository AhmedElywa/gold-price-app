import { TrendingUp, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-8 h-8 text-amber-500" />
              <h3 className="text-2xl font-bold">GoldTracker Pro</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Your trusted source for real-time gold, silver, and currency exchange rates. Stay informed with accurate
              pricing data updated every minute.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#gold" className="text-gray-300 hover:text-amber-500 transition-colors">
                  Gold Prices
                </a>
              </li>
              <li>
                <a href="#silver" className="text-gray-300 hover:text-amber-500 transition-colors">
                  Silver Prices
                </a>
              </li>
              <li>
                <a href="#exchange" className="text-gray-300 hover:text-amber-500 transition-colors">
                  Exchange Rates
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                  Historical Data
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">info@goldtracker.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">New York, NY</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">&copy; {new Date().getFullYear()} GoldTracker Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
