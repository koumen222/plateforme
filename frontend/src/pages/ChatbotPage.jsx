import Chatbot from '../components/Chatbot'

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-secondary px-4 py-6 pb-24 md:py-10 md:pb-10">
      <Chatbot displayMode="page" className="min-h-[70vh]" />
    </div>
  )
}
