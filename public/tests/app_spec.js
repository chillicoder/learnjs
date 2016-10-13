describe('LearnJS', function() {
  it('can show a problem view', function() {
    learnjs.showView('#problem-1');
    expect($('.view-container .problem-view').length).toEqual(1);
  });

  it('shows the landing page view when there is no hash', function() {
    learnjs.showView('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });

  it('passes the hash view parameter to the view function', function() {
    spyOn(learnjs, 'problemView');
    learnjs.showView('#problem-42');
    expect(learnjs.problemView).toHaveBeenCalledWith('42');
  });

  it('can redirect to the main view after the last problem is answered', function() {
    var flash = learnjs.buildCorrectFlash(2);
    expect(flash.find('a').attr('href')).toEqual('');
    expect(flash.find('a').text()).toEqual("You're finished!");
  });

  it('can trigger events on the view', function() {
    callback = jasmine.createSpy('callback');
    var div = $('<div>').bind('fooEvent',callback);
    $('.view-container').append(div);
    learnjs.triggerEvent('fooEvent',['bar']);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.argsFor(0)[1]).toEqual('bar');
  });

  describe('awsRefresh', function() {
    var callbackArg, fakeCreds;

    beforeEach(function() {
      fakeCreds = jasmine.createSpyObj('creds',['refresh']);
      fakeCreds.identityId = 'COGNITO_ID';
      AWS.config.credentials = fakeCreds;
      fakeCreds.refresh.and.callFake(function(cb) { cb(callbackArg); });
    });

    it('returns a promise that resolves on success', function(done) {
      learnjs.awsRefresh().then(function(id) {
        expect(fakeCreds.identityId).toEqual('COGNITO_ID');
      }).then(done,fail);
    });

    it('rejects the promise on a failure', function(done) {
      callbackArg = 'error';
      learnjs.awsRefresh().fail(function(err) {
        expect(err).toEqual('error');
        done();
      });
    });
  });

  describe('problem view', function() {
    var view;
    beforeEach(function() {
      view = learnjs.problemView('1');
    });

    it('has a title that includes the problem number', function() {
      expect(view.text()).toEqual('Problem #1');
    });

    it('shows the description', function() {
      expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
    });

    it('shows the problem code', function() {
      expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
    });

    describe('answer section', function() {
      var resultFlash;

      beforeEach(function() {
        spyOn(learnjs, 'flashElement');
        resultFlash = view.find('.result');
      });

      describe('skip button', function() {
        it('is added to the navbar when the view is added', function() {
          expect($('.nav-list .skip-btn').length).toEqual(1);
        });

        it('is removed from the navbar when the view is removed', function() {
          view.trigger('removingView');
          expect($('.nav-list .skip-btn').length).toEqual(0);
        });

        it('contains a link to the next problem', function() {
          expect($('.nav-list .skip-btn a').attr('href')).toEqual('#problem-2');
        });

        it('does not added when at the last problem', function() {
          view.trigger('removingView');
          view = learnjs.problemView('2');
          expect($('.nav-list .skip-btn').length).toEqual(0);
        });
      });

      describe('when the answer is correct', function() {
        beforeEach(function() {
          view.find('.answer').val('true');
          view.find('.check-btn').click();
        });

        it('flashes the result', function() {
          var flashArgs = learnjs.flashElement.calls.argsFor(0);
          expect(flashArgs[0]).toEqual(resultFlash);
          expect(flashArgs[1].find('span').text()).toEqual('Correct!');
        });

        it('shows a link to the next problem', function() {
          var link = learnjs.flashElement.calls.argsFor(0)[1].find('a');
          expect(link.text()).toEqual('Next Problem');
          expect(link.attr('href')).toEqual('#problem-2');
        });
      });

      it('rejects an incorrect answer', function() {
        view.find('.answer').val('false');
        view.find('.check-btn').click();
        expect(learnjs.flashElement).toHaveBeenCalledWith(resultFlash,'Incorrect!');
      });
    });
  });

  it('triggers removingView event when removing the view', function() {
    spyOn(learnjs, 'triggerEvent');
    learnjs.showView('#problem-1');
    expect(learnjs.triggerEvent).toHaveBeenCalledWith('removingView',[]);
  });

  it('invokes the router when loaded', function() {
    spyOn(learnjs, 'showView');
    learnjs.appOnReady();
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('subscribes to the hash change event', function() {
    learnjs.appOnReady();
    spyOn(learnjs,'showView');
    $(window).trigger('hashchange');
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('can flash an element while setting the text', function() {
    var elem = $('<p>');
    spyOn(elem, 'fadeOut').and.callThrough();
    spyOn(elem, 'fadeIn');
    learnjs.flashElement(elem, "new text");
    expect(elem.text()).toEqual("new text");
    expect(elem.fadeOut).toHaveBeenCalled();
    expect(elem.fadeIn).toHaveBeenCalled();
  });
});

