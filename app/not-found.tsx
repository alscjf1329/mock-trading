import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-sm mx-auto px-4 py-32 flex flex-col items-center text-center gap-4">
      <p className="text-6xl">📉</p>
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-400">주소가 잘못되었거나 삭제된 페이지예요</p>
      <Link href="/" className="mt-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
        랭킹 홈으로
      </Link>
    </main>
  )
}
