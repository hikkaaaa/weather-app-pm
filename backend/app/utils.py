import re

def parse_location_input(user_input): 
    """
    detecting type of location input and return dictionary for OpenWeather params
    """

    user_input = user_input.strip()

    #lat, lon 
    if re.match(r'^-?\d+(\.\d+)?,-?\d+(\.\d+)?$', user_input):
        lat, lon = user_input.split(',')
        return {"lat": lat, "lon": lon}

    #zip code (numbers + optional country code)
    if re.match(r'^\d{4,5}(?:,[A-Za-z]{2})?$', user_input):
        return {"zip": user_input}

    #city or landmark
    return {"q": user_input}
