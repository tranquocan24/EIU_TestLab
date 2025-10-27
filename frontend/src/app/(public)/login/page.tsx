import { LoginForm } from '@/components/forms/login-form'

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="login-container">
        <div className="login-card bg-white shadow-2xl rounded-2xl border-t-4 border-[#112444] p-10 w-full max-w-md">
          <div className="login-header text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">EIU TestLab</h2>
            <p className="text-gray-600">Đăng nhập hệ thống thi trực tuyến</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}