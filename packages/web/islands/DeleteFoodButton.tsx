import { useState } from "preact/hooks";

interface Props {
  foodId: string;
  foodName: string;
}

export default function DeleteFoodButton({ foodId, foodName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/foods/${foodId}`, { method: "DELETE" });
      if (res.ok) {
        globalThis.location.href = "/foods";
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete food");
        setLoading(false);
        setConfirming(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-700">Delete "{foodName}"?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span class="text-sm text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
    >
      Delete Food
    </button>
  );
}
