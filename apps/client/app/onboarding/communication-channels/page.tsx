import ChannelSelector from "./ChannelSelector";

export default function SelectCommunicationChannel() {
    const channelOptions = [
        {
            label: "Email",
            value: "email",
            subtitle: 'Get quotes delivered straight to your inbox.',
            icon: 'mdiEmailOutline',
            input: {
                type: 'email',
                placeholder: 'Enter your email address'
            }
        },
        // {
        //     label: "SMS",
        //     value: "sms",
        //     subtitle: 'Receive quotes via text message.',
        //     icon: 'mdiMessageTextOutline',
        //     input: {
        //         type: 'phone',
        //         placeholder: 'Enter your phone number'
        //     }
        // },
        // {
        //     label: "Social Media",
        //     value: "socialMedia",
        //     subtitle: 'Receive quotes via DM on your favorite platform.',
        //     icon: 'mdiForums',
        //     input: {
        //         // TBD
        //     }
        // }
    ]

    return (
        <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8">
            <main className="w-full max-w-2xl">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-gray-900 dark:text-white mb-4 sm:mb-6">
                        Receive your daily inspiration
                    </h1>
                </div>
                <ChannelSelector
                    options={channelOptions}
                    defaultSelection="email"
                ></ChannelSelector>
            </main>
        </div>
    )
}