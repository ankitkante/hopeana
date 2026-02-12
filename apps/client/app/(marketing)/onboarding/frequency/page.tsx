import FrequencySelector from "./FrequencySelector";

export default function SelectCommunicationFrequency() {

    return (
        <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8">
            <main className="w-full max-w-2xl">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-gray-900 dark:text-white mb-4 sm:mb-6">
                        Select your inspiration frequency
                    </h1>
                </div>
                <FrequencySelector
                ></FrequencySelector>
            </main>
        </div>
    )
}