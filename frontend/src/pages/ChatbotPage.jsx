import Chatbot from '../components/Chatbot'

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-secondary px-4 py-6 md:py-10">
      <Chatbot displayMode="page" className="min-h-[70vh]" />
    </div>
  )
}
