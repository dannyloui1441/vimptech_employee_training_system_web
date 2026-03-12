import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, GraduationCap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-cyan-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-bold text-5xl mb-4 text-balance">Employee Training System</h1>
          <p className="text-xl text-gray-700 font-medium">Select your panel to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Panel */}
          <Link href="/admin/dashboard" className="w-full">
            <Card className="bg-cyan-200 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 cursor-pointer hover:translate-x-2 hover:translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all h-full">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 bg-black border-4 border-black flex items-center justify-center">
                  <Shield className="h-10 w-10 text-cyan-200" />
                </div>
                <div>
                  <h2 className="font-bold text-3xl mb-2">Admin Panel</h2>
                  <p className="text-lg font-medium">Manage users, create training programs, and monitor analytics</p>
                </div>
                <Button className="w-full bg-black text-cyan-200 hover:bg-gray-900 border-2 border-black font-bold text-lg h-12 mt-4">
                  Enter Admin Panel
                </Button>
              </div>
            </Card>
          </Link>

          {/* Trainer Panel */}
          <Link href="/trainer/dashboard" className="w-full">
            <Card className="bg-yellow-200 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 cursor-pointer hover:translate-x-2 hover:translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all h-full">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 bg-black border-4 border-black flex items-center justify-center">
                  <GraduationCap className="h-10 w-10 text-yellow-200" />
                </div>
                <div>
                  <h2 className="font-bold text-3xl mb-2">Trainer Panel</h2>
                  <p className="text-lg font-medium">Manage your assigned subjects and training modules</p>
                </div>
                <Button className="w-full bg-black text-yellow-200 hover:bg-gray-900 border-2 border-black font-bold text-lg h-12 mt-4">
                  Enter Trainer Panel
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
