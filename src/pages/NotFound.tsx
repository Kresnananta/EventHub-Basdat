import { useNavigate } from "react-router-dom"
import { ArrowLeft, Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SearchX size={32} />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            404 Not Found
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mb-8 text-base leading-7 text-muted-foreground">
            URL yang kamu buka tidak tersedia atau mungkin sudah berubah.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button className="gap-2" onClick={() => navigate("/")}>
              <Home size={16} />
              Back to Home
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
