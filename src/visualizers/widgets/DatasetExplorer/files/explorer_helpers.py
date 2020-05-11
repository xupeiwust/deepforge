def metadata(name, data):
    info = {}
    info['name'] = name
    if type(data) is dict:
        info['entries'] = [metadata(k, v) for (k, v) in data.items()]
    else:
        info['shape'] = data.shape

    return info
