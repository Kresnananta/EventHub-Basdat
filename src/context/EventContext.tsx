import { createContext, useContext, useState, ReactNode } from "react"

interface EventContextType {
    selectedEventId: string | null;  // null berarti "All Event" akan ditampilkan
    selectedEventName: string;
    setEventContext: (id: string | null, name: string) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedEventName, setSelectedEventName] = useState<string>("All Event");

    const setEventContext = (id: string | null, name: string) => {
        setSelectedEventId(id);
        setSelectedEventName(name);
    };

    return (
        <EventContext.Provider value={{ selectedEventId, selectedEventName, setEventContext }}>
            {children}
        </EventContext.Provider>
    );
}

// Hook kustom agar dipanggil dengan gampang di halaman lain
export function useEventContext() {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error("useEventContext error: Tidak terbungkus EventProvider");
    }
    return context;
}
