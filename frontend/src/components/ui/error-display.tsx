import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorDisplayProps {
  error: Error | null
  title?: string
  onRetry?: () => void
  onBack?: () => void
}

export function ErrorDisplay({ error, title = 'Đã xảy ra lỗi', onRetry, onBack }: ErrorDisplayProps) {
  if (!error) return null

  const getErrorMessage = (error: Error): string => {
    // Check if it's an API error with response
    const apiError = error as any

    if (apiError.response?.data?.message) {
      return apiError.response.data.message
    }

    if (apiError.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }

    if (apiError.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.'
    }

    if (apiError.response?.status === 404) {
      return 'Không tìm thấy tài nguyên yêu cầu.'
    }

    if (apiError.response?.status >= 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.'
    }

    if (error.message) {
      return error.message
    }

    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
  }

  const getErrorSuggestion = (error: Error): string => {
    const apiError = error as any

    if (apiError.response?.status === 401) {
      return 'Bạn cần đăng nhập lại để tiếp tục.'
    }

    if (apiError.response?.status === 400) {
      return 'Vui lòng kiểm tra lại thông tin và thử lại.'
    }

    if (apiError.message?.includes('Network Error')) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    }

    if (apiError.message?.includes('timeout')) {
      return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'
    }

    return 'Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ quản trị viên.'
  }

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="font-medium">{getErrorMessage(error)}</p>
        <p className="text-sm opacity-90">{getErrorSuggestion(error)}</p>

        <div className="flex gap-2 mt-4">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="bg-white hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          )}
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-white hover:bg-gray-100"
            >
              Quay lại
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
