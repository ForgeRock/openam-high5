var ScalarComparator = {}, TelephoneNumberComparator = {};

var config = {
    profileExpiration: 30,              //in days
    maxProfilesAllowed: 5,
    maxPenaltyPoints: 0,
    attributes: {
        telephoneNumber: {
            required: true,
            comparator: TelephoneNumberComparator,
            args: {
                ignoreVersion: true,
                penaltyPoints: 100
            }
        },
    }
};

//---------------------------------------------------------------------------//
//                           Comparator functions                            //
//---------------------------------------------------------------------------//

var all, any, calculateDistance, calculateIntersection, calculatePercentage, nullOrUndefined, splitAndTrim,
    undefinedLocation;

// ComparisonResult

/**
 * Constructs an instance of a ComparisonResult with the given penalty points.
 *
 * @param penaltyPoints (Number) The penalty points for the comparison (defaults to 0).
 * @param additionalInfoInCurrentValue (boolean) Whether the current value contains more information
 *                                               than the stored value (defaults to false).
 */
function ComparisonResult() {

    var penaltyPoints = 0,
        additionalInfoInCurrentValue = false;

    if (arguments[0] !== undefined && arguments[1] !== undefined) {
        penaltyPoints = arguments[0];
        additionalInfoInCurrentValue = arguments[1];
    }

    if (arguments[0] !== undefined && arguments[1] === undefined) {
        if (typeof(arguments[0]) === "boolean") {
            additionalInfoInCurrentValue = arguments[0];
        } else {
            penaltyPoints = arguments[0];
        }
    }

    this.penaltyPoints = penaltyPoints;
    this.additionalInfoInCurrentValue = additionalInfoInCurrentValue;

}

/**
 * Returns true if the provided value is null or undefined.
 *
 * @param value: a value of any type
 * @return boolean
 */
nullOrUndefined = function(value) {
    return value === null || value === undefined;
};

ComparisonResult.ZERO_PENALTY_POINTS = new ComparisonResult(0);

/**
 * Static method for functional programming.
 *
 * @return boolean true if comparisonResult.isSuccessful().
 */
ComparisonResult.isSuccessful =  function(comparisonResult) {
    return comparisonResult.isSuccessful();
};


/**
 * Static method for functional programming.
 *
 * @return boolean true if comparisonResult.additionalInfoInCurrentValue.
 */
ComparisonResult.additionalInfoInCurrentValue =  function(comparisonResult) {
    return comparisonResult.additionalInfoInCurrentValue;
};

/**
 * Comparison function that can be provided as an argument to array.sort
 */
ComparisonResult.compare = function(first, second) {
    if (nullOrUndefined(first) && nullOrUndefined(second)) {
        return 0;
    } else if (nullOrUndefined(first)) {
        return -1;
    } else if (nullOrUndefined(second)) {
        return 1;
    } else {
        if (first.penaltyPoints !== second.penaltyPoints) {
            return first.penaltyPoints - second.penaltyPoints;
        } else {
            return (first.additionalInfoInCurrentValue ? 1 : 0) - (second.additionalInfoInCurrentValue ? 1 : 0);
        }
    }
};

/**
 * Amalgamates the given ComparisonResult into this ComparisonResult.
 *
 * @param comparisonResult The ComparisonResult to include.
 */
ComparisonResult.prototype.addComparisonResult = function(comparisonResult) {
    this.penaltyPoints += comparisonResult.penaltyPoints;
    if (comparisonResult.additionalInfoInCurrentValue) {
        this.additionalInfoInCurrentValue = comparisonResult.additionalInfoInCurrentValue;
    }
};

/**
 * Returns true if no penalty points have been assigned for the comparison.
 *
 * @return boolean true if the comparison was successful.
 */
ComparisonResult.prototype.isSuccessful = function() {
    return nullOrUndefined(this.penaltyPoints) || this.penaltyPoints === 0;
};

/**
 * Compares two simple objects (String|Number) and if they are equal then returns a ComparisonResult with zero
 * penalty points assigned, otherwise returns a ComparisonResult with the given number of penalty points assigned.
 *
 * @param currentValue (String|Number) The current value.
 * @param storedValue (String|Number) The stored value.
 * @param config: {
 *            "penaltyPoints": (Number) The number of penalty points.
 *        }
 * @return ComparisonResult.
 */
ScalarComparator.compare = function (currentValue, storedValue, config) {
    if (logger.messageEnabled()) {
        logger.message("StringComparator.compare:currentValue: " + JSON.stringify(currentValue));
        logger.message("StringComparator.compare:storedValue: " + JSON.stringify(storedValue));
        logger.message("StringComparator.compare:config: " + JSON.stringify(config));
    }
    if (config.penaltyPoints === 0) {
        return ComparisonResult.ZERO_PENALTY_POINTS;
    }

    if (!nullOrUndefined(storedValue)) {
        if (nullOrUndefined(currentValue) || currentValue !== storedValue) {
            return new ComparisonResult(config.penaltyPoints);
        }
    } else if (!nullOrUndefined(currentValue)) {
        return new ComparisonResult(true);
    }

    return ComparisonResult.ZERO_PENALTY_POINTS;
};

/**
 * Compares two telephone numbersand if they are equal then returns a ComparisonResult with zero penalty
 * points assigned, otherwise returns a ComparisonResult with the given number of penalty points assigned.
 *
 * @param currentValue (String) The current value.
 * @param storedValue (String) The stored value.
 * @param config: {
 *            "penaltyPoints": (Number) The number of penalty points.
 *        }
 * @return A ComparisonResult.
 */
TelephoneNumberComparator.compare = function (currentValue, storedValue, config) {
    if (logger.messageEnabled()) {
        logger.message("TelephoneNumberComparator.compare:currentValue: " + JSON.stringify(currentValue));
        logger.message("TelephoneNumberComparator.compare:storedValue: " + JSON.stringify(storedValue));
        logger.message("TelephoneNumberComparator.compare:config: " + JSON.stringify(config));
    }

    return ScalarComparator.compare(currentValue, storedValue, config);
};

//---------------------------------------------------------------------------//
//                    Device Print Logic - DO NOT MODIFY                     //
//---------------------------------------------------------------------------//
function getValue(obj, attributePath) {
    var value = obj,
        i;
    for (i = 0; i < attributePath.length; i++) {
        if (value === undefined) {
            return null;
        }
        value = value[attributePath[i]];
    }
    return value;
}


function isLeafNode(attributeConfig) {
    return attributeConfig.comparator !== undefined;
}

function getAttributePaths(attributeConfig, attributePath) {

    var attributePaths = [],
        attributeName,
        attrPaths,
        attrPath,
        i;

    for (attributeName in attributeConfig) {
        if (attributeConfig.hasOwnProperty(attributeName)) {

            if (isLeafNode(attributeConfig[attributeName])) {
                attrPath = attributePath.slice();
                attrPath.push(attributeName);
                attributePaths.push(attrPath);
            } else {
                attrPath = attributePath.slice();
                attrPath.push(attributeName);
                attrPaths = getAttributePaths(attributeConfig[attributeName], attrPath);
                for (i = 0; i < attrPaths.length; i++) {
                    attributePaths.push(attrPaths[i]);
                }
            }
        }
    }

    return attributePaths;
}

function getDevicePrintAttributePaths(attributeConfig) {
    return getAttributePaths(attributeConfig, []);
}

function hasRequiredAttributes(devicePrint, attributeConfig) {

    var attributePaths = getDevicePrintAttributePaths(attributeConfig),
        i,
        attrValue,
        attrConfig;

    for (i = 0; i < attributePaths.length; i++) {

        attrValue = getValue(devicePrint, attributePaths[i]);
        attrConfig = getValue(attributeConfig, attributePaths[i]);

        if (attrConfig.required && attrValue === undefined) {
            logger.warning("Telephonenumber Device Print profile missing required attribute, " + attributePaths[i]);
            return false;
        }
    }

    logger.message("Telephonenumber device print has required attributes");
    return true;
}

function compareTelephonenumberDevicePrintProfiles(attributeConfig, devicePrint, devicePrintProfiles, maxPenaltyPoints) {

    var attributePaths = getDevicePrintAttributePaths(attributeConfig),
        results,
        j,
        aggregatedComparisonResult,
        i,
        currentValue,
        storedValue,
        attrConfig,
        comparisonResult,
        selectedComparisonResult,
        selectedProfile,
        vals;

    results = [];
    for (j = 0; j < devicePrintProfiles.length; j++) {

        aggregatedComparisonResult = new ComparisonResult();
        for (i = 0; i < attributePaths.length; i++) {

            currentValue = getValue(devicePrint, attributePaths[i]);
            storedValue = getValue(devicePrintProfiles[j].devicePrint, attributePaths[i]);
            attrConfig = getValue(attributeConfig, attributePaths[i]);

            if (storedValue === null) {
                comparisonResult = new ComparisonResult(attrConfig.penaltyPoints);
            } else {
                comparisonResult = attrConfig.comparator.compare(currentValue, storedValue, attrConfig.args);
            }

            if (logger.messageEnabled()) {
                logger.message("Comparing attribute path: " + attributePaths[i]
                    + ", Comparison result: successful=" + comparisonResult.isSuccessful() + ", penaltyPoints="
                    + comparisonResult.penaltyPoints + ", additionalInfoInCurrentValue="
                    + comparisonResult.additionalInfoInCurrentValue);
            }
            aggregatedComparisonResult.addComparisonResult(comparisonResult);
        }
        if (logger.messageEnabled()) {
            logger.message("Aggregated comparison result: successful="
                + aggregatedComparisonResult.isSuccessful() + ", penaltyPoints="
                + aggregatedComparisonResult.penaltyPoints + ", additionalInfoInCurrentValue="
                + aggregatedComparisonResult.additionalInfoInCurrentValue);
        }

        results.push({
            key: aggregatedComparisonResult,
            value: devicePrintProfiles[j]
        });
    }

    if (results.length === 0) {
        return null;
    }

    results.sort(function(a, b) {
        return ComparisonResult.compare(a.key, b.key);
    });
    selectedComparisonResult = results[0].key;
    if (logger.messageEnabled()) {
        logger.message("Selected comparison result: successful=" + selectedComparisonResult.isSuccessful()
            + ", penaltyPoints=" + selectedComparisonResult.penaltyPoints + ", additionalInfoInCurrentValue="
            + selectedComparisonResult.additionalInfoInCurrentValue);
    }

    selectedProfile = null;
    if (selectedComparisonResult.penaltyPoints <= maxPenaltyPoints) {
        selectedProfile = results[0].value;
        if (logger.messageEnabled()) {
            logger.message("Selected profile: " + JSON.stringify(selectedProfile) +
                " with " + selectedComparisonResult.penaltyPoints + " penalty points");
        }
    }

    if (selectedProfile === null) {
        return false;
    }

    /* update profile */
    selectedProfile.selectionCounter = selectedProfile.selectionCounter + 1;
    selectedProfile.lastSelectedDate = new Date().getTime();
    selectedProfile.devicePrint = devicePrint;

    vals = [];
    for (i = 0; i < devicePrintProfiles.length; i++) {
        vals.push(JSON.stringify(devicePrintProfiles[i]));
    }

    idRepository.setAttribute(username, "devicePrintProfiles", vals);

    return true;
}

function matchTelephonenumberDevicePrint() {

    if (!username) {
        logger.error("Username not set. Cannot compare user's telephonenumber device print profiles.");
        authState = FAILED;
    } else {
        if (logger.messageEnabled()) {
            logger.message("client telephoneNumberDevicePrint: " + clientScriptOutputData);
        }
        var getProfiles = function () {

                function isExpiredProfile(devicePrintProfile) {
                    var expirationDate = new Date(),
                        lastSelectedDate;
                    expirationDate.setDate(expirationDate.getDate() - config.profileExpiration);

                    lastSelectedDate = new Date(devicePrintProfile.lastSelectedDate);

                    return lastSelectedDate < expirationDate;
                }

                function getNotExpiredProfiles() {
                    var results = [],
                        profiles = idRepository.getAttribute(username, "devicePrintProfiles"),
                        iter = profiles.iterator(),
                        profile;
                    while (iter.hasNext()) {
                        profile = JSON.parse(iter.next());
                        if (!isExpiredProfile(profile)) {
                            results.push(profile);
                        }
                    }
                    if (logger.messageEnabled()) {
                        logger.message("stored non-expired profiles: " + JSON.stringify(results));
                    }
                    return results;
                }

                return getNotExpiredProfiles();
            },
            devicePrint = JSON.parse(clientScriptOutputData),
            devicePrintProfiles = getProfiles();

        if (!hasRequiredAttributes(devicePrint, config.attributes)) {
            logger.message("telephonenumberDevicePrint.hasRequiredAttributes: false");
	    // Remove the following line once OPENAM-6656 is fixed
            sharedState.put('devicePrintProfile', JSON.stringify(devicePrint));
            // Will fail this module but fall-through to next module. Which should be OTP.
            authState = FAILED;
        } else if (compareTelephonenumberDevicePrintProfiles(config.attributes, devicePrint, devicePrintProfiles, config.maxPenaltyPoints)) {
            logger.message("telephonenumerDevicePrint.hasValidProfile: true");
            authState = SUCCESS;
        } else {
            logger.message("telephoneNumberDevicePrint.hasValidProfile: false");
            logger.message("telephoneNumberDevicePrint: Adding device print to shared state");
            sharedState.put('devicePrintProfile', JSON.stringify(devicePrint));
            // Will fail this module but fall-through to next module. Which should be OTP.
            authState = FAILED;
        }
    }
}

matchTelephonenumberDevicePrint();
