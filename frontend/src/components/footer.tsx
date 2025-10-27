import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Image
            src="https://cdn.haitrieu.com/wp-content/uploads/2021/12/Logo-DH-Quoc-Te-Mien-Dong-EIU.png"
            alt="Logo EIU"
            width={140}
            height={35}
            className="h-[35px] w-auto"
            priority={false}
          />
          <p className="text-[#112444] text-[13px] text-center m-0">
            &copy; 2025 <strong>EIU TestLab</strong> - Hệ thống thi trực tuyến
            <br />
            Trường Đại Học Quốc Tế Miền Đông (Eastern International University)
          </p>
        </div>
      </div>
    </footer>
  )
}
