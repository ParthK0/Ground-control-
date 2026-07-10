import time
from app.services.recommendation import check_density_threshold, is_zone_in_cooldown, set_zone_cooldown

def test_check_density_threshold():
    # z1 has capacity 4000 (85% is 3400)
    assert not check_density_threshold("z1", 3399)
    assert check_density_threshold("z1", 3400)
    assert check_density_threshold("z1", 4000)
    
    # Invalid zone should return False
    assert not check_density_threshold("invalid_zone", 100)

def test_recommendation_cooldown():
    zone_id = "test_zone"
    # Initially not in cooldown
    assert not is_zone_in_cooldown(zone_id)
    
    # Set cooldown
    set_zone_cooldown(zone_id)
    assert is_zone_in_cooldown(zone_id)
    
    # Update cooldown to be older than 120 seconds to simulate expiry
    from app.services.recommendation import RECOMMENDATION_COOLDOWN
    RECOMMENDATION_COOLDOWN[zone_id] = time.time() - 130
    assert not is_zone_in_cooldown(zone_id)
