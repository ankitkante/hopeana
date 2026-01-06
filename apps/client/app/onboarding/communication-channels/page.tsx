export default function SelectCommunicationChannel() {
    const channelOptions = [
        {
            label: "Email",
            value: "email",
            subtitle: 'Get quotes delivered straight to your inbox.',
            icon: 'mdiEmailOutline',
            inputType: 'email'
        },
        {
            label: "SMS",
            value: "sms",
            subtitle: 'Receive quotes via text message.',
            icon: 'mdiMessageTextOutline',
            inputType: 'phone'
        },
        {
            label: "SMS",
            value: "sms",
            subtitle: 'Receive quotes via text message.',
            icon: 'mdiMessageTextOutline',
            inputType: 'phone'
        }
    ]
    const onChannelChange = ()=>{
        // Add code when new communication channels are added
    }

    return (
        <div className="text-center m-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-gray-900 dark:text-white mb-4 sm:mb-6">
                Receive your daily inspiration
            </h1>
            
        </div>
    )
}