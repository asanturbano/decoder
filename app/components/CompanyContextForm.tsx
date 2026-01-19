interface CompanyContextFormProps {
  companyName: string;
  website: string;
  description: string;
  isLoading: boolean;
  onCompanyNameChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const inputClassName =
  "w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-amber-600 focus:border-transparent";

export function CompanyContextForm({
  companyName,
  website,
  description,
  isLoading,
  onCompanyNameChange,
  onWebsiteChange,
  onDescriptionChange,
}: CompanyContextFormProps) {
  return (
    <div className="p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg no-print">
      <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
        Company Context <span className="text-stone-400 font-normal">(optional)</span>
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm text-stone-600 dark:text-stone-400 mb-1"
          >
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="e.g., Anthropic, OpenAI, Mercury"
            className={inputClassName}
            disabled={isLoading}
          />
        </div>
        <div>
          <label
            htmlFor="website"
            className="block text-sm text-stone-600 dark:text-stone-400 mb-1"
          >
            Website
          </label>
          <input
            type="text"
            id="website"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="e.g., anthropic.com"
            className={inputClassName}
            disabled={isLoading}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Recommended - helps identify the correct company
          </p>
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm text-stone-600 dark:text-stone-400 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="What does your company do?"
            rows={2}
            className={inputClassName}
            disabled={isLoading}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Example: &apos;AI safety research company&apos; or &apos;Fintech for startups&apos;
          </p>
        </div>
      </div>
    </div>
  );
}
