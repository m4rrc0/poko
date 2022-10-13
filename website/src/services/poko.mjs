export const presetsDico = {
    HeaderTitle: {
        components: {
            h1: "h2",
            h2: "h3",
            h3: "h4",
            h4: "h5",
            h5: "h6",
            header: "HeaderTitle"
        }
    },
    rows: {"test is ok": true }
}

export const getPresets = props => {
    let presets = []

    if (!Array.isArray(props.presets)) {
        // If it is an object, it is probably an object with only one key coming from a DB property
        if (typeof props.presets === 'object') {
            presets = [ props.presets ]
        } else {
            presets = []
        }
    } else presets = props.presets

    presets = presets.map(preset => {
        if (typeof preset === 'string') return presetsDico[preset] || undefined
        if (typeof preset === 'object' && !Array.isArray(preset)) {
            // If the values are booleans, we can treat the key as strings (useful for DB properties)
            return Object.entries(preset).map(([key, val]) => {
                if (typeof val === "boolean") return presetsDico[key] || undefined
                // TODO: How would this work...? Could we pass options into presets?
            })
        }
    }).flat().filter(z => typeof z !== 'undefined')
    
    return presets
}