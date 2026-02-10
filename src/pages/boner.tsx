import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Bone } from 'lucide-react'

const Boner = () => {

    return (
        <StationLogin
            stationName="Boner"
            stationIcon={<Bone size={24} />}
            stationColor="bg-destructive"
            targetRole="deshuesador"
        >
            <h1>Boner</h1>
        </StationLogin>
    )
}

export default Boner
