import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";

export default function useActiveStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useActiveStore must be used within a StoreProvider");
    }
    return context;
}